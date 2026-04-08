"use client";

import { useState, useEffect } from "react";
import * as pdfjs from "pdfjs-dist";
import { PDFDocument, degrees } from "pdf-lib";
import { 
  RotateCw, 
  RotateCcw, 
  Download, 
  Loader2, 
  X,
  FileText,
  RefreshCw
} from "lucide-react";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import PDFDropzone from "./PDFDropzone";
import { cn } from "@/lib/utils";

// Initialize PDF.js worker
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

interface PageRotation {
  pageIndex: number;
  rotation: number; // 0, 90, 180, 270
  thumbnail: string;
}

export default function PDFRotate() {
  const [file, setFile] = useState<File | null>(null);
  const [pageRotations, setPageRotations] = useState<PageRotation[]>([]);
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
    setPageRotations([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const initialRotations: PageRotation[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 }); // Low res for thumbnails
        
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        initialRotations.push({
          pageIndex: i - 1,
          rotation: 0,
          thumbnail: canvas.toDataURL("image/jpeg", 0.7)
        });
      }

      setPageRotations(initialRotations);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load PDF pages");
    } finally {
      setLoadingPages(false);
    }
  };

  const rotatePage = (index: number, direction: 'cw' | 'ccw') => {
    setPageRotations(prev => prev.map((p, i) => {
      if (i !== index) return p;
      let nextRotation = direction === 'cw' ? p.rotation + 90 : p.rotation - 90;
      if (nextRotation >= 360) nextRotation = 0;
      if (nextRotation < 0) nextRotation = 270;
      return { ...p, rotation: nextRotation };
    }));
  };

  const rotateAll = (deg: number) => {
    setPageRotations(prev => prev.map(p => ({ ...p, rotation: deg })));
  };

  const handleSave = async () => {
    if (!file || pageRotations.length === 0) return;

    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      pageRotations.forEach(p => {
        if (p.rotation !== 0) {
          const page = pages[p.pageIndex];
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees(currentRotation + p.rotation));
        }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      saveAs(blob, `rotated_${file.name}`);
      toast.success("PDF saved with rotations!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save rotated PDF");
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
          label="Select a PDF to rotate pages" 
        />
      ) : (
        <div className="space-y-8">
          {/* Header Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl border border-white/5 bg-zinc-950/50 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-0.5">{file.name}</h3>
                <p className="text-xs text-zinc-500">{pageRotations.length} Pages detected</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/5">
                {[90, 180, 270].map(deg => (
                  <button
                    key={deg}
                    onClick={() => rotateAll(deg)}
                    className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  >
                    All {deg}°
                  </button>
                ))}
              </div>
              <button
                onClick={handleSave}
                disabled={processing || loadingPages}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Save Changes
              </button>
              <button
                onClick={() => { setFile(null); setPageRotations([]); }}
                className="p-2.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {loadingPages ? (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
              <p className="text-zinc-500 font-medium">Rendering page previews...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {pageRotations.map((p, idx) => (
                <div key={idx} className="group space-y-3">
                  <div className="relative aspect-[3/4] rounded-2xl border border-white/5 bg-zinc-900/40 overflow-hidden shadow-xl">
                    <img 
                      src={p.thumbnail} 
                      alt={`Page ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500"
                      style={{ transform: `rotate(${p.rotation}deg)` }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                       <button 
                        onClick={() => rotatePage(idx, 'ccw')}
                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md transition-all"
                       >
                         <RotateCcw className="h-4 w-4" />
                       </button>
                       <button 
                        onClick={() => rotatePage(idx, 'cw')}
                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md transition-all"
                       >
                         <RotateCw className="h-4 w-4" />
                       </button>
                    </div>
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/5">
                      {idx + 1}
                    </div>
                    {p.rotation !== 0 && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-indigo-500 text-[10px] font-black text-white shadow-lg">
                        {p.rotation}°
                      </div>
                    )}
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
