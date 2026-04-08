import os
from pypdf import PdfReader, PdfWriter
from typing import List

class PDFManipulator:
    @staticmethod
    def merge_pdfs(pdf_paths: List[str], output_path: str):
        """Merge multiple PDFs into one."""
        writer = PdfWriter()
        for path in pdf_paths:
            writer.append(path)
        
        with open(output_path, "wb") as f:
            writer.write(f)
        writer.close()
        return output_path

    @staticmethod
    def split_pdf(pdf_path: str, page_ranges: List[tuple], output_dir: str) -> List[str]:
        """
        Split PDF into multiple files based on page ranges.
        Each range is a tuple (start_page, end_page) 0-indexed.
        """
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        reader = PdfReader(pdf_path)
        output_paths = []
        
        for i, (start, end) in enumerate(page_ranges):
            writer = PdfWriter()
            # Ensure end is not out of bounds
            actual_end = min(end, len(reader.pages) - 1)
            for page_num in range(start, actual_end + 1):
                writer.add_page(reader.pages[page_num])
            
            filename = f"split_{i+1}_{start+1}-{actual_end+1}.pdf"
            filepath = os.path.join(output_dir, filename)
            with open(filepath, "wb") as f:
                writer.write(f)
            writer.close()
            output_paths.append(filepath)
            
        return output_paths

    @staticmethod
    def compress_pdf(pdf_path: str, output_path: str):
        """Compress PDF by using content stream compression."""
        reader = PdfReader(pdf_path)
        writer = PdfWriter()
        
        for page in reader.pages:
            page.compress_content_streams()
            writer.add_page(page)
            
        with open(output_path, "wb") as f:
            writer.write(f)
        writer.close()
        return output_path

    @staticmethod
    def protect_pdf(pdf_path: str, output_path: str, password: str):
        """Encrypt PDF with a password."""
        reader = PdfReader(pdf_path)
        writer = PdfWriter()
        
        for page in reader.pages:
            writer.add_page(page)
            
        writer.encrypt(password)
        
        with open(output_path, "wb") as f:
            writer.write(f)
        writer.close()
        return output_path

    @staticmethod
    def unlock_pdf(pdf_path: str, output_path: str, password: str):
        """Decrypt PDF with a password."""
        reader = PdfReader(pdf_path)
        if reader.is_encrypted:
            reader.decrypt(password)
            
        writer = PdfWriter()
        for page in reader.pages:
            writer.add_page(page)
            
        with open(output_path, "wb") as f:
            writer.write(f)
        writer.close()
        return output_path
