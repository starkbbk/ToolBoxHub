"use client";

import { useState } from "react";
import * as pdfjs from "pdfjs-dist/build/pdf";
import pptxgen from "pptxgenjs";
import { 
  Presentation, 
  Download, 
  Loader2, 
  X,
  ArrowRight,
  Monitor,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import PDFDropzone from "./PDFDropzone";
import { cn } from "@/lib/utils";

// Initialize PDF.js worker
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

export default function PDFToPPT() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const convertToPPT = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(5);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const pptx = new pptxgen();

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // 2x for clarity
        
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        const imageData = canvas.toDataURL("image/jpeg", 0.9);
        
        const slide = pptx.addSlide();
        slide.addImage({ 
          data: imageData, 
          x: 0, 
          y: 0, 
          w: '100%', 
          h: '100%',
          sizing: { type: 'contain', w: 10, h: 5.625 } // standard 16:9
        });

        setProgress(Math.round((i / numPages) * 90) + 5);
      }

      await pptx.writeFile({ fileName: `${file.name.replace(".pdf", "")}.pptx` });
      
      setProgress(100);
      toast.success("PDF converted to PowerPoint successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to convert PDF to PowerPoint");
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!file ? (
        <PDFDropzone 
          onFilesSelected={handleFileSelected} 
          multiple={false} 
          label="Select a PDF to convert to PowerPoint" 
        />
      ) : (
        <div className="space-y-8">
          {/* File Card */}
          <div className="flex items-center gap-4 p-6 rounded-3xl border border-white/5 bg-zinc-950/50 backdrop-blur-xl">
            <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400">
              <Presentation className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white mb-0.5">{file.name}</h3>
              <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="p-2.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Action Area */}
          <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/40 rounded-3xl border border-white/5 border-dashed">
            {processing ? (
              <div className="text-center space-y-6 w-full max-w-md">
                <div className="relative h-20 w-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-orange-500/10 border-t-orange-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-orange-400 font-bold">
                    {progress}%
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-white font-medium">Reconstructing slides...</p>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-8">
                  <div className="flex flex-col items-center gap-2">
                     <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <FileText className="h-8 w-8" />
                     </div>
                     <span className="text-xs font-bold text-zinc-500 uppercase">PDF</span>
                  </div>
                  <ArrowRight className="h-6 w-6 text-zinc-700" />
                  <div className="flex flex-col items-center gap-2">
                     <div className="p-4 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                        <Presentation className="h-8 w-8" />
                     </div>
                     <span className="text-xs font-bold text-zinc-500 uppercase">PPTX</span>
                  </div>
                </div>
                
                <button
                  onClick={convertToPPT}
                  className="px-10 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-bold flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                >
                  <Monitor className="h-5 w-5" />
                  Convert to PPTX
                </button>
              </div>
            )}
          </div>
          
          <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 text-center">
             <p className="text-xs text-orange-300 leading-relaxed italic">
               Note: Each PDF page becomes a slide image to preserve layout perfectly. Text is not natively editable as shapes.
             </p>
          </div>
        </div>
      )}
    </div>
  );
}
