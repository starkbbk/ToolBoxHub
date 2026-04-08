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
        Detect text regions in an image using EasyOCR.
        Returns list of dicts with keys: x, y, w, h, text, confidence
        """
        reader = get_ocr_reader()
        
        # Decode image from bytes
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return []
        
        # Run OCR
        results = reader.readtext(img)
        
        regions = []
        for (bbox, text, confidence) in results:
            if confidence < 0.3:  # Filter low-confidence detections
                continue
            
            # bbox is [[x1,y1],[x2,y1],[x2,y2],[x1,y2]]
            xs = [pt[0] for pt in bbox]
            ys = [pt[1] for pt in bbox]
            x = int(min(xs))
            y = int(min(ys))
            w = int(max(xs) - min(xs))
            h = int(max(ys) - min(ys))
            
            regions.append({
                "x": x, "y": y, "w": w, "h": h,
                "text": text,
                "confidence": round(confidence, 3)
            })
        
        return regions


class InpainterService:
    @staticmethod
    def inpaint_image(image_path: str, mask_path: str, output_path: str, radius: int = 3):
        """
        Inpaint an image using the Telea algorithm.
        """
        img = cv2.imread(image_path)
        mask = cv2.imread(mask_path, 0) # Grayscale mask
        
        # Ensure mask and image are same size
        if img.shape[:2] != mask.shape[:2]:
            mask = cv2.resize(mask, (img.shape[1], img.shape[0]))

        # Telea algorithm is usually better for text removal
        result = cv2.inpaint(img, mask, radius, cv2.INPAINT_TELEA)
        cv2.imwrite(output_path, result)
        return output_path

    @staticmethod
    def inpaint_video(video_path: str, mask_regions: List[dict], output_path: str, on_progress=None):
        """
        Inpaint a video by processing it frame by frame.
        mask_regions: List of {'x', 'y', 'w', 'h', 'start_time', 'end_time'}
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
            fps = eval(video_info['avg_frame_rate'])
            
            frame_files = sorted(os.listdir(frames_dir))
            total_frames = len(frame_files)

            # 4. Process each frame
            for i, frame_name in enumerate(frame_files):
                frame_path = os.path.join(frames_dir, frame_name)
                frame = cv2.imread(frame_path)
                h, w = frame.shape[:2]
                
                # Create mask for this frame
                mask = np.zeros((h, w), dtype=np.uint8)
                current_time = i / fps
                
                for region in mask_regions:
                    # Check if region is active at this time
                    if region.get('start_time', 0) <= current_time <= region.get('end_time', float('inf')):
                        x, y = int(region['x']), int(region['y'])
                        rw, rh = int(region['w']), int(region['h'])
                        cv2.rectangle(mask, (x, y), (x + rw, y + rh), 255, -1)
                
                # Inpaint
                if np.any(mask > 0):
                    cleaned_frame = cv2.inpaint(frame, mask, 3, cv2.INPAINT_TELEA)
                else:
                    cleaned_frame = frame
                
                cv2.imwrite(os.path.join(cleaned_dir, frame_name), cleaned_frame)
                
                if on_progress:
                    on_progress(int(((i + 1) / total_frames) * 100))

            # 5. Re-encode video with original audio
            audio = ffmpeg.input(video_path).audio
            (
                ffmpeg
                .input(os.path.join(cleaned_dir, "frame_%05d.png"), framerate=fps)
                .output(audio, output_path, vcodec='libx264', pix_fmt='yuv420p', acodec='copy')
                .overwrite_output()
                .run(quiet=True)
            )

            return output_path

        finally:
            shutil.rmtree(temp_dir)
