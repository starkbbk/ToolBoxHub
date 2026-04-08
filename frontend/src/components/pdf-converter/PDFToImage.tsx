"use client";

import { useState } from "react";
import * as pdfjs from "pdfjs-dist/build/pdf";
import { 
  FileImage, 
  Download, 
  Loader2, 
  X, 
  Image as ImageIcon,
  Archive,
  Zap
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

      // 4.17x scale provides 301 DPI (301/72)
      const SCALE = 4.2; 

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: SCALE }); 
        
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        
        if (!context) continue;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Ensure high quality image smoothing
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        const dataUrl = canvas.toDataURL("image/png", 1.0);
        convertedImages.push({ src: dataUrl, pageNumber: i });
        setProgress(Math.round((i / numPages) * 100));
      }

      setImages(convertedImages);
      toast.success(`Rendered ${numPages} pages at 300 DPI`);
    } catch (error) {
      console.error(error);
      toast.error("High-res rendering failed");
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const downloadAllAsZip = async () => {
    if (images.length === 0) return;

    const zip = new JSZip();
    const folder = zip.folder(`${file?.name.replace(".pdf", "")}_300dpi`);

    images.forEach((img) => {
      const base64Data = img.src.split(",")[1];
      folder?.file(`page_${img.pageNumber}.png`, base64Data, { base64: true });
    });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${file?.name.replace(".pdf", "")}_images_300dpi.zip`);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!file ? (
        <PDFDropzone 
          onFilesSelected={handleFileSelected} 
          multiple={false} 
          accept={{ "application/pdf": [".pdf"] }}
          label="Select a PDF to render high-resolution images (300 DPI)" 
        />
      ) : (
        <div className="space-y-8">
          {/* File Card */}
          <div className="flex items-center gap-4 rounded-3xl border border-white/5 bg-zinc-950/50 p-6 backdrop-blur-xl">
            <div className="rounded-2xl bg-rose-500/10 p-4 text-rose-400">
              <FileImage className="h-8 w-8" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate text-lg">{file.name}</p>
              <p className="text-zinc-500 text-sm">Target: Professional 300 DPI Rendering</p>
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
            <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/20 rounded-3xl border border-white/5 border-dashed gap-6">
              {processing ? (
                <div className="text-center space-y-8 w-full max-w-md">
                   <div className="flex items-center justify-center gap-4">
                      <div className="h-4 w-4 bg-rose-500 rounded-full animate-bounce" />
                      <div className="h-4 w-4 bg-rose-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="h-4 w-4 bg-rose-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                   </div>
                   <div className="space-y-3">
                      <p className="text-white font-black italic tracking-widest text-sm uppercase">Rendering Page Detail {progress}%</p>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-500 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                   </div>
                </div>
              ) : (
                <>
                  <div className="p-6 rounded-3xl bg-rose-500/5 text-rose-400 border border-rose-500/10 animate-pulse">
                     <Zap className="h-10 w-10" />
                  </div>
                  <button
                    onClick={convertToImages}
                    className="px-12 py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(225,29,72,0.3)]"
                  >
                    <ImageIcon className="h-6 w-6" />
                    Render at 300 DPI
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-zinc-900/40 rounded-3xl border border-white/5">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Archive className="h-5 w-5 text-rose-400" />
                  Processing Complete
                </h3>
                <button
                  onClick={downloadAllAsZip}
                  className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-500/10"
                >
                  <Archive className="h-5 w-5" />
                  Download 300DPI Bundle
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {images.map((img) => (
                  <div key={img.pageNumber} className="group relative aspect-[3/4] rounded-3xl overflow-hidden bg-zinc-950 border border-white/5 shadow-2xl">
                    <img 
                      src={img.src} 
                      alt={`Page ${img.pageNumber}`} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    />
                    <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-black text-white uppercase tracking-widest">
                      HD Page {img.pageNumber}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end p-8 gap-4">
                      <button
                        onClick={() => saveAs(img.src, `page_${img.pageNumber}.png`)}
                        className="w-full py-4 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform"
                      >
                        <Download className="h-5 w-5" />
                        Save High-Res
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
