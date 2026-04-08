import cv2
import numpy as np
import os
import shutil
import tempfile
import ffmpeg
import easyocr
from typing import List, Tuple

# Initialize EasyOCR reader once at module load (avoids repeated model loading)
_ocr_reader = None

def get_ocr_reader():
    global _ocr_reader
    if _ocr_reader is None:
        _ocr_reader = easyocr.Reader(['en'], gpu=False)
    return _ocr_reader

class OCRService:
    @staticmethod
    def detect_text(image_bytes: bytes) -> List[dict]:
        """
        Detect text regions and expand them to capture the full background banner/overlay.
        """
        reader = get_ocr_reader()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return []
        
        h, w = img.shape[:2]
        results = reader.readtext(img)
        
        raw_regions = []
        for (bbox, text, confidence) in results:
            if confidence < 0.2:
                continue
            xs = [pt[0] for pt in bbox]
            ys = [pt[1] for pt in bbox]
            raw_regions.append({
                "x": int(min(xs)), "y": int(min(ys)),
                "w": int(max(xs) - min(xs)), "h": int(max(ys) - min(ys)),
                "text": text, "confidence": round(confidence, 3)
            })

        if not raw_regions:
            return []

        # Group regions that are part of the same overlay (spatially close)
        groups = []
        # Sort by y, then x for consistent grouping
        raw_regions.sort(key=lambda r: (r['y'], r['x']))
        
        for r in raw_regions:
            found_group = False
            for group in groups:
                # Calculate group bounds
                gx_min = min(rg['x'] for rg in group)
                gy_min = min(rg['y'] for rg in group)
                gx_max = max(rg['x'] + rg['w'] for rg in group)
                gy_max = max(rg['y'] + rg['h'] for rg in group)
                
                # Proximity thresholds
                v_threshold = 50 # Vertical pixels
                h_threshold = 100 # Horizontal pixels
                
                # Check if region is vertically close and horizontally overlapping or within h_threshold
                v_close = (r['y'] - gy_max) < v_threshold and (gy_min - (r['y'] + r['h'])) < v_threshold
                h_close = (r['x'] - gx_max) < h_threshold and (gx_min - (r['x'] + r['w'])) < h_threshold
                
                if v_close and h_close:
                    group.append(r)
                    found_group = True
                    break
            if not found_group:
                groups.append([r])

        expanded_regions = []
        for i, group in enumerate(groups):
            min_x = min(r['x'] for r in group)
            min_y = min(r['y'] for r in group)
            max_x = max(r['x'] + r['w'] for r in group)
            max_y = max(r['y'] + r['h'] for r in group)
            
            # Expanded Banner Logic:
            # Add generous padding to capture the semi-transparent background bar, icons, and rounded edges
            # Users report banners are often 50-80px wider than text.
            padding_x = 60
            padding_y = 30
            
            ex = max(0, min_x - padding_x)
            ey = max(0, min_y - padding_y)
            ew = min(w - ex, (max_x - min_x) + (padding_x * 2))
            eh = min(h - ey, (max_y - min_y) + (padding_y * 2))
            
            expanded_regions.append({
                "id": f"group-{i}",
                "x": ex, "y": ey, "w": ew, "h": eh,
                "text": " | ".join([r['text'] for r in group]),
                "confidence": max(r['confidence'] for r in group),
                "is_group": True
            })

        return expanded_regions


class InpainterService:
    @staticmethod
    def _dilate_mask(mask: np.ndarray, kernel_size: int = 5) -> np.ndarray:
        """
        Dilate the mask to cover anti-aliasing edges and silhouettes.
        """
        if kernel_size <= 0:
            return mask
        kernel = np.ones((kernel_size, kernel_size), np.uint8)
        return cv2.dilate(mask, kernel, iterations=1)

    @staticmethod
    def inpaint_image(image_path: str, regions: List[dict], output_path: str, inpaint_radius: int = 10):
        """
        Inpaint an image using the Telea algorithm with mask dilation.
        """
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError("Could not read image")
            
        h, w = img.shape[:2]
        
        # Create binary mask from regions
        mask = np.zeros((h, w), dtype=np.uint8)
        for r in regions:
            x, y, rw, rh = int(r['x']), int(r['y']), int(r['w']), int(r['h'])
            cv2.rectangle(mask, (x, y), (x + rw, y + rh), 255, -1)
            
        # Dilate mask to ensure edges are covered
        mask = InpainterService._dilate_mask(mask, kernel_size=7)

        # Apply inpainting
        result = cv2.inpaint(img, mask, inpaint_radius, cv2.INPAINT_TELEA)
        cv2.imwrite(output_path, result)
        return output_path

    @staticmethod
    def inpaint_video(video_path: str, mask_regions: List[dict], output_path: str, on_progress=None):
        """
        Inpaint a video by processing it frame by frame with mask dilation.
        """
        # 1. Create temp directory for frames
        temp_dir = tempfile.mkdtemp()
        frames_dir = os.path.join(temp_dir, "frames")
        cleaned_dir = os.path.join(temp_dir, "cleaned")
        os.makedirs(frames_dir)
        os.makedirs(cleaned_dir)

        try:
            # 2. Extract frames
            (
                ffmpeg
                .input(video_path)
                .output(os.path.join(frames_dir, "frame_%05d.png"))
                .run(quiet=True)
            )

            # 3. Get video info for re-encoding
            probe = ffmpeg.probe(video_path)
            video_info = next(s for s in probe['streams'] if s['codec_type'] == 'video')
            fps_str = video_info['avg_frame_rate']
            fps = eval(fps_str) if '/' in fps_str else float(fps_str)
            
            frame_files = sorted(os.listdir(frames_dir))
            total_frames = len(frame_files)

            # 4. Process each frame
            for i, frame_name in enumerate(frame_files):
                frame_path = os.path.join(frames_dir, frame_name)
                frame = cv2.imread(frame_path)
                if frame is None:
                    continue
                h, w = frame.shape[:2]
                
                # Create mask for this frame
                mask = np.zeros((h, w), dtype=np.uint8)
                current_time = i / fps
                
                has_active_regions = False
                for region in mask_regions:
                    if region.get('start_time', 0) <= current_time <= region.get('end_time', float('inf')):
                        x, y = int(region['x']), int(region['y'])
                        rw, rh = int(region['w']), int(region['h'])
                        cv2.rectangle(mask, (x, y), (x + rw, y + rh), 255, -1)
                        has_active_regions = True
                
                # Inpaint if there are active regions
                if has_active_regions:
                    # Dilate mask for videos too
                    mask = InpainterService._dilate_mask(mask, kernel_size=7)
                    cleaned_frame = cv2.inpaint(frame, mask, 10, cv2.INPAINT_TELEA)
                else:
                    cleaned_frame = frame
                
                cv2.imwrite(os.path.join(cleaned_dir, frame_name), cleaned_frame)
                
                if on_progress:
                    on_progress(int(((i + 1) / total_frames) * 100))

            # 5. Re-encode video with original audio
            audio = None
            try:
                audio = ffmpeg.input(video_path).audio
            except:
                pass # No audio stream

            stream = ffmpeg.input(os.path.join(cleaned_dir, "frame_%05d.png"), framerate=fps)
            if audio:
                stream = ffmpeg.output(stream, audio, output_path, vcodec='libx264', pix_fmt='yuv420p', acodec='copy')
            else:
                stream = ffmpeg.output(stream, output_path, vcodec='libx264', pix_fmt='yuv420p')
            
            stream.overwrite_output().run(quiet=True)

            return output_path

        finally:
            shutil.rmtree(temp_dir)
