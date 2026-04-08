"use client";

import { useState } from "react";
import * as pdfjs from "pdfjs-dist/build/pdf";
import { PDFDocument } from "pdf-lib";
import { 
  Contrast, 
  Download, 
  Loader2, 
  X,
  FileOutput,
  Palette
} from "lucide-react";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import PDFDropzone from "./PDFDropzone";
import { cn } from "@/lib/utils";

// Initialize PDF.js worker
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

export default function PDFGrayscale() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  const convertToGrayscale = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(5);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const outPdf = await PDFDocument.create();

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({ canvasContext: ctx, viewport }).promise;

        // Apply Grayscale Filter on Canvas
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let j = 0; j < data.length; j += 4) {
          const avg = (data[j] + data[j + 1] + data[j + 2]) / 3;
          data[j] = avg;     // R
          data[j + 1] = avg; // G
          data[j + 2] = avg; // B
        }
        ctx.putImageData(imageData, 0, 0);

        const grayscaleImage = canvas.toDataURL("image/jpeg", 0.8);
        const embeddedImage = await outPdf.embedJpg(grayscaleImage);
        
        const newPage = outPdf.addPage([viewport.width, viewport.height]);
        newPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
        });

        setProgress(Math.round((i / numPages) * 100));
      }

      const pdfBytes = await outPdf.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      saveAs(blob, `grayscale_${file.name}`);
      toast.success("PDF converted to grayscale successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Grayscale conversion failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!file ? (
        <PDFDropzone onFilesSelected={handleFileSelected} multiple={false} label="Select a color PDF to convert to grayscale" />
      ) : (
        <div className="space-y-8">
           <div className="flex items-center gap-6 p-8 rounded-[40px] border border-white/5 bg-zinc-950/50 backdrop-blur-xl shadow-2xl">
             <div className="h-16 w-16 rounded-3xl bg-zinc-800/50 flex items-center justify-center text-zinc-400">
                <Palette className="h-8 w-8" />
             </div>
             <div className="flex-1 min-w-0">
               <h3 className="text-lg font-bold text-white truncate mb-1">{file.name}</h3>
               <p className="text-sm text-zinc-500">Industry-standard B&W conversion</p>
             </div>
             <button onClick={() => setFile(null)} className="p-3 text-zinc-500 hover:text-white transition-all bg-white/5 rounded-2xl">
                <X className="h-6 w-6" />
             </button>
           </div>

           {!processing ? (
             <div className="p-12 rounded-[40px] border border-white/5 bg-zinc-900/40 flex flex-col items-center justify-center gap-8 text-center scale-in duration-500">
                <div className="p-8 rounded-full bg-zinc-950 border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
                   <Contrast className="h-16 w-16 text-white" />
                </div>
                <div className="space-y-2">
                   <h4 className="text-xl font-black text-white">Convert to Black & White</h4>
                   <p className="text-sm text-zinc-500 max-w-md mx-auto">
                     Ideal for printing and professional documentation. We'll convert every page and image into high-fidelity grayscale.
                   </p>
                </div>
                <button
                  onClick={convertToGrayscale}
                  className="px-16 py-5 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-white/5"
                >
                  Convert PDF to Grayscale
                </button>
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center p-20 bg-zinc-900/40 rounded-[40px] border border-white/5 gap-8">
                <div className="relative h-28 w-28">
                   <div className="absolute inset-0 rounded-full border-4 border-white/5 border-t-white animate-spin" />
                   <div className="absolute inset-0 flex items-center justify-center text-white font-black italic">
                      {progress}%
                   </div>
                </div>
                <div className="text-center space-y-2">
                   <h4 className="text-xl font-bold text-white capitalize">Processing Colors...</h4>
                   <p className="text-sm text-zinc-500 italic">Desaturating streams and rebuilding layout</p>
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
