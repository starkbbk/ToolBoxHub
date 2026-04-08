"use client";

import { useState } from "react";
import * as pdfjs from "pdfjs-dist";
import { 
  FileImage, 
  Download, 
  Loader2, 
  X, 
  Image as ImageIcon,
  Archive
} from "lucide-react";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { toast } from "sonner";
import PDFDropzone from "./PDFDropzone";
import { cn } from "@/lib/utils";

// Initialize PDF.js worker
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

interface PageImage {
  src: string;
  pageNumber: number;
}

export default function PDFToImage() {
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<PageImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setImages([]);
    }
  };

  const convertToImages = async () => {
    if (!file) return;

    setProcessing(true);
    setImages([]);
    setProgress(0);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const convertedImages: PageImage[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // 2x for better quality
        
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        
        if (!context) continue;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        const dataUrl = canvas.toDataURL("image/png");
        convertedImages.push({ src: dataUrl, pageNumber: i });
        setProgress(Math.round((i / numPages) * 100));
      }

      setImages(convertedImages);
      toast.success(`Successfully converted ${numPages} pages to images`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to convert PDF to images");
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const downloadAllAsZip = async () => {
    if (images.length === 0) return;

    const zip = new JSZip();
    const folder = zip.folder(`${file?.name.replace(".pdf", "")}_pages`);

    images.forEach((img) => {
      const base64Data = img.src.split(",")[1];
      folder?.file(`page_${img.pageNumber}.png`, base64Data, { base64: true });
    });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${file?.name.replace(".pdf", "")}_images.zip`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!file ? (
        <PDFDropzone 
          onFilesSelected={handleFileSelected} 
          multiple={false} 
          label="Select a PDF to convert to images" 
        />
      ) : (
        <div className="space-y-8">
          {/* File Card */}
          <div className="flex items-center gap-4 rounded-3xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-sm">
            <div className="rounded-2xl bg-rose-500/10 p-4 text-rose-400">
              <FileImage className="h-8 w-8" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate text-lg">{file.name}</p>
              <p className="text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            {!processing && (
              <button 
                onClick={() => { setFile(null); setImages([]); }}
                className="p-3 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>

          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/20 rounded-3xl border border-white/5 border-dashed">
              {processing ? (
                <div className="text-center space-y-4 w-full max-w-md">
                  <div className="relative h-20 w-20 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-rose-500/10 border-t-rose-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-rose-400 font-bold">
                      {progress}%
                    </div>
                  </div>
                  <p className="text-white font-medium">Extracting high-resolution pages...</p>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={convertToImages}
                  className="px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(225,29,72,0.3)]"
                >
                  <ImageIcon className="h-5 w-5" />
                  Convert PDF to Images
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Archive className="h-5 w-5 text-rose-400" />
                  Converted Images ({images.length})
                </h3>
                <button
                  onClick={downloadAllAsZip}
                  className="flex items-center gap-2 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all border border-white/5 shadow-lg"
                >
                  <Archive className="h-4 w-4" />
                  Download ZIP
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((img) => (
                  <div key={img.pageNumber} className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-800 border border-white/5">
                    <img 
                      src={img.src} 
                      alt={`Page ${img.pageNumber}`} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white">
                      PAGE {img.pageNumber}
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                      <span className="text-white font-bold">Page {img.pageNumber}</span>
                      <button
                        onClick={() => saveAs(img.src, `page_${img.pageNumber}.png`)}
                        className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-xl"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
