"use client";

import { useState, useEffect } from "react";
import * as pdfjs from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";
import { 
  FileOutput, 
  Download, 
  Loader2, 
  X,
  Plus,
  Files
} from "lucide-react";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import PDFDropzone from "./PDFDropzone";
import { cn } from "@/lib/utils";

// Initialize PDF.js worker
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

interface PageData {
  index: number;
  thumbnail: string;
}

export default function PDFExtractPages() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageData[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  useEffect(() => {
    if (file) loadPages();
  }, [file]);

  const loadPages = async () => {
    if (!file) return;
    setLoading(true);
    setSelectedIndices(new Set());
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const loaded: PageData[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: ctx, viewport }).promise;
        loaded.push({ index: i - 1, thumbnail: canvas.toDataURL() });
      }
      setPages(loaded);
    } catch (error) {
      toast.error("Failed to load PDF pages");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedIndices(next);
  };

  const handleExtract = async () => {
    if (!file || selectedIndices.size === 0) return;

    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();
      
      const sortedSelected = Array.from(selectedIndices).sort((a, b) => a - b);
      const pagesToCopy = await newPdf.copyPages(pdfDoc, sortedSelected);
      pagesToCopy.forEach(p => newPdf.addPage(p));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      saveAs(blob, `extracted_${file.name}`);
      toast.success(`Extracted ${selectedIndices.size} pages successfully!`);
    } catch (error) {
      toast.error("Failed to extract pages");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!file ? (
        <PDFDropzone onFilesSelected={handleFileSelected} multiple={false} label="Select a PDF to extract pages" />
      ) : (
        <div className="space-y-8">
           <div className="flex flex-wrap items-center justify-between gap-6 p-8 rounded-[40px] border border-white/5 bg-zinc-950/50 backdrop-blur-xl shadow-2xl">
             <div className="flex items-center gap-6">
               <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Files className="h-7 w-7" />
               </div>
               <div>
                 <h3 className="font-bold text-white mb-0.5">{file.name}</h3>
                 <p className="text-xs text-zinc-500">{pages.length} Pages • Select pages you want to keep</p>
               </div>
             </div>
             <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-zinc-900 rounded-xl border border-white/5 text-sm font-bold text-zinc-400">
                   {selectedIndices.size} selected
                </div>
                <button
                  disabled={selectedIndices.size === 0 || processing}
                  onClick={handleExtract}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileOutput className="h-4 w-4" />}
                  Extract Selected
                </button>
                <button onClick={() => setFile(null)} className="p-3 text-zinc-500 hover:text-white transition-all bg-white/5 rounded-xl">
                  <X className="h-5 w-5" />
                </button>
             </div>
           </div>

           {loading ? (
             <div className="flex flex-col items-center justify-center p-40 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                <p className="text-zinc-500 font-medium">Loading pages...</p>
             </div>
           ) : (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 h-[calc(100vh-350px)] overflow-y-auto pr-4 custom-scrollbar p-1">
                {pages.map(p => (
                  <div 
                    key={p.index}
                    onClick={() => toggleSelect(p.index)}
                    className={cn(
                      "relative group aspect-[3/4] rounded-2xl border-2 transition-all cursor-pointer overflow-hidden",
                      selectedIndices.has(p.index) 
                        ? "border-indigo-500 shadow-lg shadow-indigo-500/20" 
                        : "border-white/5 hover:border-white/20"
                    )}
                  >
                    <img src={p.thumbnail} alt={`Page ${p.index + 1}`} className="w-full h-full object-cover" />
                    
                    <div className={cn(
                      "absolute inset-0 flex flex-col items-center justify-center transition-all",
                      selectedIndices.has(p.index) ? "bg-indigo-500/40 backdrop-blur-sm" : "bg-transparent group-hover:bg-black/20"
                    )}>
                       {selectedIndices.has(p.index) ? (
                         <div className="p-3 rounded-full bg-white text-indigo-600 shadow-xl scale-110 border border-white">
                           <Plus className="h-6 w-6" />
                         </div>
                       ) : (
                         <div className="opacity-0 group-hover:opacity-100 p-3 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 transition-all">
                           <Plus className="h-5 w-5" />
                         </div>
                       )}
                    </div>

                    <div className="absolute bottom-3 left-3 px-2 py-0.5 bg-black/50 backdrop-blur-md rounded text-[10px] font-bold text-white">
                       {p.index + 1}
                    </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      )}
    </div>
  );
}
