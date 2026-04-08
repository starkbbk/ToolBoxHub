"use client";

import { useState, useEffect } from "react";
import * as pdfjs from "pdfjs-dist/build/pdf";
import { PDFDocument } from "pdf-lib";
import { Reorder, motion, AnimatePresence } from "framer-motion";
import { 
  Layout, 
  Download, 
  Loader2, 
  X,
  FileText,
  Copy,
  Trash2,
  GripHorizontal
} from "lucide-react";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import PDFDropzone from "./PDFDropzone";
import { cn } from "@/lib/utils";

// Initialize PDF.js worker
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

interface PageItem {
  id: string; // Unique ID for reordering
  originalIndex: number;
  thumbnail: string;
}

export default function PDFOrganize() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [loadingPages, setLoadingPages] = useState(false);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  useEffect(() => {
    if (file) {
      loadThumbnails();
    }
  }, [file]);

  const loadThumbnails = async () => {
    if (!file) return;
    setLoadingPages(true);
    setPages([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const loadedPages: PageItem[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.4 });
        
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        loadedPages.push({
          id: Math.random().toString(36).substr(2, 9),
          originalIndex: i - 1,
          thumbnail: canvas.toDataURL("image/jpeg", 0.7)
        });
      }

      setPages(loadedPages);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load PDF pages");
    } finally {
      setLoadingPages(false);
    }
  };

  const removePage = (id: string) => {
    setPages(prev => prev.filter(p => p.id !== id));
  };

  const duplicatePage = (index: number) => {
    setPages(prev => {
      const next = [...prev];
      const pageToDup = { ...next[index], id: Math.random().toString(36).substr(2, 9) };
      next.splice(index + 1, 0, pageToDup);
      return next;
    });
  };

  const handleSave = async () => {
    if (!file || pages.length === 0) return;

    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();
      
      // Map current reordered indices to original page objects
      const indicesToCopy = pages.map(p => p.originalIndex);
      const copiedPages = await newPdf.copyPages(pdfDoc, indicesToCopy);
      
      copiedPages.forEach(p => newPdf.addPage(p));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      saveAs(blob, `organized_${file.name}`);
      toast.success("PDF organized successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to organize PDF");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!file ? (
        <PDFDropzone 
          onFilesSelected={handleFileSelected} 
          multiple={false} 
          label="Select a PDF to organize pages" 
        />
      ) : (
        <div className="space-y-8">
          {/* Header Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl border border-white/5 bg-zinc-950/50 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                <Layout className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-0.5">{file.name}</h3>
                <p className="text-xs text-zinc-500">{pages.length} Pages active</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={processing || loadingPages || pages.length === 0}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Save Document
              </button>
              <button
                onClick={() => { setFile(null); setPages([]); }}
                className="p-2.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {loadingPages ? (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
              <p className="text-zinc-500 font-medium">Generating page thumbnails...</p>
            </div>
          ) : (
            <Reorder.Group 
              axis="x" 
              values={pages} 
              onReorder={setPages}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {pages.map((p, idx) => (
                  <Reorder.Item
                    key={p.id}
                    value={p}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="group space-y-3 cursor-grab active:cursor-grabbing"
                  >
                    <div className="relative aspect-[3/4] rounded-2xl border border-white/5 bg-zinc-900/40 overflow-hidden shadow-xl group-hover:border-indigo-500/50 transition-all">
                      <img 
                        src={p.thumbnail} 
                        alt={`Page ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Controls Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                         <button 
                          onClick={(e) => { e.stopPropagation(); duplicatePage(idx); }}
                          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md transition-all shadow-lg"
                          title="Duplicate Page"
                         >
                           <Copy className="h-4 w-4" />
                         </button>
                         <button 
                          onClick={(e) => { e.stopPropagation(); removePage(p.id); }}
                          className="p-2 bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 rounded-xl backdrop-blur-md transition-all shadow-lg"
                          title="Delete Page"
                         >
                           <Trash2 className="h-4 w-4" />
                         </button>
                      </div>

                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/5">
                        {idx + 1}
                      </div>

                      <div className="absolute bottom-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 rounded-lg backdrop-blur-md">
                        <GripHorizontal className="h-4 w-4 text-white/50" />
                      </div>
                    </div>
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>
          )}

          {!loadingPages && pages.length === 0 && file && (
            <div className="text-center p-20 border-2 border-dashed border-white/5 rounded-3xl">
              <p className="text-zinc-500 italic">No pages left. Drag a PDF here to start again.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
