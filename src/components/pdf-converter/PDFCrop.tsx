"use client";

import { useState, useEffect } from "react";
import * as pdfjs from "pdfjs-dist/build/pdf";
import { PDFDocument } from "pdf-lib";
import { 
  Crop, 
  Download, 
  Loader2, 
  X,
  FileOutput,
  Fullscreen,
  Settings2
} from "lucide-react";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import PDFDropzone from "./PDFDropzone";
import { cn } from "@/lib/utils";

// Initialize PDF.js worker
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

interface PagePreview {
  index: number;
  thumbnail: string;
  width: number;
  height: number;
}

export default function PDFCrop() {
  const [file, setFile] = useState<File | null>(null);
  const [previews, setPreviews] = useState<PagePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [margins, setMargins] = useState({ top: 10, right: 10, bottom: 10, left: 10 });

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  useEffect(() => {
    if (file) loadPreviews();
  }, [file]);

  const loadPreviews = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const loaded: PagePreview[] = [];

      for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) { // Only preview first few
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: ctx, viewport }).promise;
        loaded.push({ 
          index: i - 1, 
          thumbnail: canvas.toDataURL(),
          width: viewport.width,
          height: viewport.height
        });
      }
      setPreviews(loaded);
    } catch (error) {
      toast.error("Failed to load PDF preview");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCrop = async () => {
    if (!file) return;

    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      pages.forEach(page => {
        const { width, height } = page.getSize();
        // Set CropBox - units are in points (1/72 inch)
        page.setCropBox(
          margins.left, 
          margins.bottom, 
          width - margins.left - margins.right, 
          height - margins.bottom - margins.top
        );
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      saveAs(blob, `cropped_${file.name}`);
      toast.success("PDF cropped successfully!");
    } catch (error) {
      toast.error("Failed to crop PDF");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!file ? (
        <PDFDropzone onFilesSelected={handleFileSelected} multiple={false} label="Select a PDF to crop" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Controls */}
           <div className="lg:col-span-1 space-y-6">
              <div className="p-8 rounded-[40px] border border-white/5 bg-zinc-900/40 space-y-8 scale-in duration-500">
                 <div className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-widest">
                    <Settings2 className="h-4 w-4" />
                    Crop Margins (pts)
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    {(Object.keys(margins) as (keyof typeof margins)[]).map(side => (
                      <div key={side} className="space-y-2">
                         <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block ml-1">{side}</label>
                         <input 
                           type="number"
                           value={margins[side]}
                           onChange={(e) => setMargins({...margins, [side]: parseInt(e.target.value) || 0})}
                           className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                         />
                      </div>
                    ))}
                 </div>

                 <button
                   onClick={handleApplyCrop}
                   disabled={processing}
                   className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                 >
                   {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Crop className="h-5 w-5" />}
                   Apply Crop to All
                 </button>
              </div>
           </div>

           {/* Preview Area */}
           <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between p-6 rounded-3xl border border-white/5 bg-zinc-950/50 backdrop-blur-xl">
                 <div className="flex items-center gap-3">
                    <Fullscreen className="h-5 w-5 text-indigo-400" />
                    <span className="text-sm font-bold text-white">Visual Preview</span>
                 </div>
                 <button onClick={() => setFile(null)} className="p-2 text-zinc-500 hover:text-white transition-all">
                    <X className="h-5 w-5" />
                 </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center p-40">
                   <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                </div>
              ) : (
                <div className="relative aspect-[3/4] bg-zinc-950 rounded-[40px] border border-white/5 flex items-center justify-center p-12 overflow-hidden shadow-2xl">
                   {previews[0] && (
                     <div className="relative group">
                        <img src={previews[0].thumbnail} alt="Crop Preview" className="max-w-full h-auto opacity-40 grayscale" />
                        {/* Overlay Crop Box */}
                        <div 
                          className="absolute border-2 border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                          style={{
                            top: `${(margins.top / 10)}%`,
                            left: `${(margins.left / 10)}%`,
                            right: `${(margins.right / 10)}%`,
                            bottom: `${(margins.bottom / 10)}%`,
                          }}
                        />
                     </div>
                   )}
                   <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest bg-zinc-900 px-4 py-2 rounded-full border border-white/5">
                      Previewing Page 1
                   </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}
