import os
import shutil
import tempfile
import ffmpeg
import numpy as np
import gc
import psutil
from typing import List, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def log_memory_usage(context: str):
    process = psutil.Process(os.getpid())
    mem = process.memory_info().rss / 1024 / 1024
    logger.info(f"MEMORY USAGE [{context}]: {mem:.2f} MB")

class InpainterService:
    @staticmethod
    def _get_cv2():
        """Lazy load cv2 to save memory on startup"""
        import cv2
        return cv2

    @staticmethod
    def _dilate_mask(mask: np.ndarray, kernel_size: int = 5) -> np.ndarray:
        """
        Dilate the mask to cover anti-aliasing edges and silhouettes.
        """
        cv2 = InpainterService._get_cv2()
        if kernel_size <= 0:
            return mask
        kernel = np.ones((kernel_size, kernel_size), np.uint8)
        return cv2.dilate(mask, kernel, iterations=1)

    @staticmethod
    def inpaint_image(image_path: str, regions: List[dict], output_path: str, inpaint_radius: int = 7):
        """
        Inpaint an image using the Navier-Stokes algorithm.
        Accepts regions as [{"x":, "y":, "w":, "h":}] and creates a mask.
        """
        cv2 = InpainterService._get_cv2()
        log_memory_usage("Before Image Inpaint")

        img = cv2.imread(image_path)
        if img is None:
            raise ValueError("Could not read image")
            
        h, w = img.shape[:2]
        
        # 1. Create binary mask from regions
        mask = np.zeros((h, w), dtype=np.uint8)
        for r in regions:
            x, y, rw, rh = int(r['x']), int(r['y']), int(r['w']), int(r['h'])
            cv2.rectangle(mask, (x, y), (x + rw, y + rh), 255, -1)
            
        # 2. Dilate mask to cover edges (Surgical 5px kernel as requested)
        mask = InpainterService._dilate_mask(mask, kernel_size=5)

        # 3. Apply Navier-Stokes inpainting for sharpness
        inpainted = cv2.inpaint(img, mask, inpaint_radius, cv2.INPAINT_NS)
        
        # 4. Composite Reconstruction: Perfect pixel preservation outside the mask
        result = img.copy()
        result[mask > 0] = inpainted[mask > 0]
        
        cv2.imwrite(output_path, result)

        # Cleanup
        del img
        del mask
        del inpainted
        del result
        gc.collect()
        log_memory_usage("After Image Inpaint")
        
        return output_path

    @staticmethod
    def inpaint_frame_bytes(frame_bytes: bytes, regions: List[dict], inpaint_radius: int = 7) -> bytes:
        """
        Process a single frame provided as bytes. 
        Used for the new /video-frame endpoint.
        """
        cv2 = InpainterService._get_cv2()
        nparr = np.frombuffer(frame_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return b""

        h, w = img.shape[:2]
        mask = np.zeros((h, w), dtype=np.uint8)
        for r in regions:
            x, y, rw, rh = int(r['x']), int(r['y']), int(r['w']), int(r['h'])
            cv2.rectangle(mask, (x, y), (x + rw, y + rh), 255, -1)

        mask = InpainterService._dilate_mask(mask, kernel_size=5)
        inpainted = cv2.inpaint(img, mask, inpaint_radius, cv2.INPAINT_NS)
        
        result = img.copy()
        result[mask > 0] = inpainted[mask > 0]
        
        _, buffer = cv2.imencode('.png', result)
        
        # Cleanup
        del img
        del mask
        del inpainted
        del result
        gc.collect()
        
        return buffer.tobytes()

    @staticmethod
    def inpaint_video(video_path: str, mask_regions: List[dict], output_path: str, on_progress=None):
        """
        Inpaint a video by processing it frame by frame.
        Note: This is still heavy but optimized for memory usage per frame.
        """
        cv2 = InpainterService._get_cv2()
        log_memory_usage("Starting Video Inpaint")
        
        temp_dir = tempfile.mkdtemp()
        frames_dir = os.path.join(temp_dir, "frames")
        cleaned_dir = os.path.join(temp_dir, "cleaned")
        os.makedirs(frames_dir)
        os.makedirs(cleaned_dir)

        try:
            # Extract frames
            (
                ffmpeg
                .input(video_path)
                .output(os.path.join(frames_dir, "frame_%05d.png"))
                .run(quiet=True)
            )

            probe = ffmpeg.probe(video_path)
            video_info = next(s for s in probe['streams'] if s['codec_type'] == 'video')
            fps_str = video_info['avg_frame_rate']
            fps = eval(fps_str) if '/' in fps_str else float(fps_str)
            
            frame_files = sorted(os.listdir(frames_dir))
            total_frames = len(frame_files)

            for i, frame_name in enumerate(frame_files):
                frame_path = os.path.join(frames_dir, frame_name)
                frame = cv2.imread(frame_path)
                if frame is None: continue
                
                h, w = frame.shape[:2]
                mask = np.zeros((h, w), dtype=np.uint8)
                current_time = i / fps
                
                has_active_regions = False
                for region in mask_regions:
                    if region.get('start_time', 0) <= current_time <= region.get('end_time', float('inf')):
                        x, y, rw, rh = int(region['x']), int(region['y']), int(region['w']), int(region['h'])
                        cv2.rectangle(mask, (x, y), (x + rw, y + rh), 255, -1)
                        has_active_regions = True
                
                if has_active_regions:
                    mask = InpainterService._dilate_mask(mask, kernel_size=5)
                    inpainted_frame = cv2.inpaint(frame, mask, 3, cv2.INPAINT_NS)
                    cleaned_frame = frame.copy()
                    cleaned_frame[mask > 0] = inpainted_frame[mask > 0]
                else:
                    cleaned_frame = frame
                
                cv2.imwrite(os.path.join(cleaned_dir, frame_name), cleaned_frame)
                
                # Mandatory periodic cleanup for video
                if i % 10 == 0:
                    gc.collect()

                if on_progress:
                    on_progress(int(((i + 1) / total_frames) * 100))

            # Encode video
            audio = None
            try: audio = ffmpeg.input(video_path).audio
            except: pass

            stream = ffmpeg.input(os.path.join(cleaned_dir, "frame_%05d.png"), framerate=fps)
            if audio:
                stream = ffmpeg.output(stream, audio, output_path, vcodec='libx264', pix_fmt='yuv420p', acodec='copy')
            else:
                stream = ffmpeg.output(stream, output_path, vcodec='libx264', pix_fmt='yuv420p')
            
            stream.overwrite_output().run(quiet=True)
            log_memory_usage("Finished Video Inpaint")
            return output_path

        finally:
            shutil.rmtree(temp_dir)
            gc.collect()
