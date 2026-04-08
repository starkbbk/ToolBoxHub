import os
import fitz  # PyMuPDF
from typing import List, Tuple
from shared.file_utils import generate_uuid_filename

class PDFService:
    @staticmethod
    def extract_text(pdf_path: str) -> str:
        """Extract full text from a PDF."""
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text

    @staticmethod
    def convert_to_images(pdf_path: str, output_dir: str, dpi: int = 200) -> List[str]:
        """Convert each page of a PDF to an image."""
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        doc = fitz.open(pdf_path)
        image_paths = []
        
        for i, page in enumerate(doc):
            pix = page.get_pixmap(matrix=fitz.Matrix(dpi/72, dpi/72))
            filename = f"page_{i+1}.png"
            filepath = os.path.join(output_dir, filename)
            pix.save(filepath)
            image_paths.append(filepath)
            
        doc.close()
        return image_paths

    @staticmethod
    def get_info(pdf_path: str) -> dict:
        """Get PDF metadata and page count."""
        doc = fitz.open(pdf_path)
        info = {
            "page_count": doc.page_count,
            "metadata": doc.metadata,
            "is_encrypted": doc.is_encrypted
        }
        doc.close()
        return info
