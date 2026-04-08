"use client";

import { useState } from "react";
import { Reorder, motion, AnimatePresence } from "framer-motion";
import { 
  ImageIcon, 
  GripVertical, 
  X, 
  FileText, 
  Download,
  Loader2,
  Plus
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import PDFDropzone from "./PDFDropzone";
import { cn } from "@/lib/utils";

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

export default function ImageToPDF() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFilesSelected = (newFiles: File[]) => {
    const newImageFiles = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImageFiles]);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      const removed = prev.find(img => img.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
  };

  /**
   * Helper to convert an image file to a PNG format using Canvas
   * Necessary for WEBP which isn't natively supported by pdf-lib
   */
  const convertToPng = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Could not get canvas context");
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (!blob) return reject("Canvas toBlob failed");
          blob.arrayBuffer().then(resolve).catch(reject);
        }, "image/png");
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleConvertToPDF = async () => {
    if (images.length === 0) return;

    setProcessing(true);
    setProgress(0);
    try {
      const pdfDoc = await PDFDocument.create();
      
      // Standard A4 size in points (72 DPI)
      const A4_WIDTH = 595.28;
      const A4_HEIGHT = 841.89;

      for (let i = 0; i < images.length; i++) {
        const imgFile = images[i];
        const fileType = imgFile.file.type;
        let imageBytes: ArrayBuffer;
        let embeddedImage;

        // 1. Get bytes and embed
        if (fileType === "image/webp") {
          imageBytes = await convertToPng(imgFile.file);
          embeddedImage = await pdfDoc.embedPng(imageBytes);
        } else if (fileType === "image/png") {
          imageBytes = await imgFile.file.arrayBuffer();
          embeddedImage = await pdfDoc.embedPng(imageBytes);
        } else {
          // Assume JPG or fallback to JPG embedding
          imageBytes = await imgFile.file.arrayBuffer();
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
        }

        // 2. Calculate dimensions
        const { width: imgWidth, height: imgHeight } = embeddedImage.size();
        let drawWidth = imgWidth;
        let drawHeight = imgHeight;
        
        // Scale to fit A4 if larger, or just fit to A4 width
        const scale = Math.min(A4_WIDTH / imgWidth, A4_HEIGHT / imgHeight, 1);
        drawWidth = imgWidth * scale;
        drawHeight = imgHeight * scale;

        // 3. Add page and draw
        const page = pdfDoc.addPage([drawWidth, drawHeight]);
        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: drawWidth,
          height: drawHeight,
        });

        setProgress(Math.round(((i + 1) / images.length) * 100));
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      saveAs(blob, `converted_${Date.now()}.pdf`);
      
      const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
      toast.success(`PDF generated: ${sizeMB} MB`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF");
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!images.length ? (
        <PDFDropzone 
          onFilesSelected={handleFilesSelected} 
          accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp"] }}
          label="Select images to convert to PDF" 
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-amber-400" />
                Selected Images ({images.length})
              </h3>
              <button 
                onClick={() => {
                  images.forEach(img => URL.revokeObjectURL(img.preview));
                  setImages([]);
                }}
                className="text-sm text-zinc-500 hover:text-rose-400 transition-colors"
              >
                Clear all
              </button>
            </div>

            <Reorder.Group 
              axis="y" 
              values={images} 
              onReorder={setImages}
              className="space-y-3"
            >
              <AnimatePresence mode="popLayout">
                {images.map((img) => (
                  <Reorder.Item
                    key={img.id}
                    value={img}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group"
                  >
                    <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-zinc-900/40 p-3 hover:bg-zinc-900/60 transition-colors backdrop-blur-sm">
                      <div className="cursor-grab active:cursor-grabbing p-1 text-zinc-600 hover:text-zinc-400">
                        <GripVertical className="h-5 w-5" />
                      </div>
                      
                      <div className="h-16 w-16 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 border border-white/5">
                        <img src={img.preview} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate text-sm">{img.file.name}</p>
                        <p className="text-xs text-zinc-500">{(img.file.size / 1024).toFixed(1)} KB</p>
                      </div>

                      <button 
                        onClick={() => removeImage(img.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>

            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.files) {
                    handleFilesSelected(Array.from(target.files));
                  }
                };
                input.click();
              }}
              className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center gap-2 text-zinc-500 hover:text-white hover:border-white/10 hover:bg-white/5 transition-all group"
            >
              <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span>Add more images</span>
            </button>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-3xl border border-white/10 bg-zinc-900/80 p-6 backdrop-blur-xl shadow-2xl">
              <h4 className="text-lg font-bold text-white mb-4">Export Options</h4>
              
              <div className="space-y-4 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Format:</span>
                  <span className="text-white font-medium">A4 PDF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Pages:</span>
                  <span className="text-white font-medium">{images.length}</span>
                </div>
              </div>

              <button
                disabled={images.length === 0 || processing}
                onClick={handleConvertToPDF}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all",
                  images.length === 0 || processing
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                {processing ? (
                  <div className="flex flex-col items-center w-full px-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                      <span className="text-sm">Converting {progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <FileText className="h-5 w-5" />
                    <span>Generate PDF</span>
                  </>
                )}
              </button>

              <div className="mt-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <p className="text-xs text-amber-300 text-center leading-relaxed">
                  Images will be scaled to fit A4 pages correctly. High resolution is maintained.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
