"use client";

import { useState } from "react";
import { PDFDocument, PageSizes } from "pdf-lib";
import { 
  Maximize2, 
  Download, 
  Loader2, 
  X,
  FileOutput,
  Scale,
  Settings2
} from "lucide-react";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import PDFDropzone from "./PDFDropzone";
import { cn } from "@/lib/utils";

const PAGE_PRESETS = {
  "A4": PageSizes.A4,
  "Letter": PageSizes.Letter,
  "Legal": PageSizes.Legal,
  "A3": PageSizes.A3,
  "A5": PageSizes.A5,
};

export default function PDFResize() {
  const [file, setFile] = useState<File | null>(null);
  const [preset, setPreset] = useState<keyof typeof PAGE_PRESETS>("A4");
  const [processing, setProcessing] = useState(false);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  const handleResize = async () => {
    if (!file) return;

    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      
      const targetSize = PAGE_PRESETS[preset];

      pages.forEach(page => {
        // Simple resize - sets the page size without scaling content (content might be cut or have borders)
        // For professional resize, we'd scale the content as well.
        page.setSize(targetSize[0], targetSize[1]);
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      saveAs(blob, `resized_${file.name}`);
      toast.success(`PDF resized to ${preset} successfully!`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to resize PDF");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!file ? (
        <PDFDropzone onFilesSelected={handleFileSelected} multiple={false} label="Select a PDF to resize" />
      ) : (
        <div className="space-y-8">
           <div className="flex items-center gap-6 p-8 rounded-[40px] border border-white/5 bg-zinc-950/50 backdrop-blur-xl shadow-2xl">
             <div className="h-16 w-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Scale className="h-8 w-8 text-indigo-500" />
             </div>
             <div className="flex-1 min-w-0">
               <h3 className="text-lg font-bold text-white truncate mb-1">{file.name}</h3>
               <p className="text-sm text-zinc-500">Change page dimensions instantly</p>
             </div>
             <button onClick={() => setFile(null)} className="p-3 text-zinc-500 hover:text-white transition-all bg-white/5 rounded-2xl">
                <X className="h-6 w-6" />
             </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Presets Grid */}
              <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                 {(Object.keys(PAGE_PRESETS) as (keyof typeof PAGE_PRESETS)[]).map(p => (
                   <button
                    key={p}
                    onClick={() => setPreset(p)}
                    className={cn(
                      "p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3",
                      preset === p 
                        ? "bg-indigo-500/10 border-indigo-500 text-white shadow-xl shadow-indigo-500/10" 
                        : "bg-zinc-900 border-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                    )}
                   >
                     <div className="h-12 w-10 border-2 border-current rounded-sm flex items-center justify-center font-black text-[10px]">
                        {p}
                     </div>
                     <span className="font-bold text-xs">{p}</span>
                   </button>
                 ))}
              </div>

              {/* Action Column */}
              <div className="md:col-span-1 p-8 rounded-[32px] border border-white/5 bg-zinc-900/40 space-y-6 flex flex-col justify-center">
                 <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-widest">
                       <Settings2 className="h-4 w-4" />
                       Page Options
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed italic">
                      Resizing will adjust the canvas size. Content will be aligned to the bottom-left by default.
                    </p>
                 </div>
                 
                 <button
                   onClick={handleResize}
                   disabled={processing}
                   className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-500/20"
                 >
                   {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Maximize2 className="h-5 w-5" />}
                   Apply Size Change
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
