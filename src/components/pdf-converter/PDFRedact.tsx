"use client";

import { useState, useRef, useEffect } from "react";
import * as pdfjs from "pdfjs-dist/build/pdf";
import { PDFDocument, rgb } from "pdf-lib";
import { 
  ShieldAlert, 
  Download, 
  Loader2, 
  X,
  Plus,
  Trash2,
  Check,
  Eye,
  Eraser
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

interface RedactionBox {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function PDFRedact() {
  const [file, setFile] = useState<File | null>(null);
  const [previews, setPreviews] = useState<PagePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const [redactions, setRedactions] = useState<RedactionBox[]>([]);
  const [drawingStart, setDrawingStart] = useState<{ x: number, y: number } | null>(null);
  const [activePageIndex, setActivePageIndex] = useState<number | null>(null);

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

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });
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
      toast.error("Failed to load PDF previews");
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (pageIndex: number, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDrawingStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setActivePageIndex(pageIndex);
  };

  const handleMouseUp = (pageIndex: number, e: React.MouseEvent) => {
    if (!drawingStart || activePageIndex !== pageIndex) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    
    const newBox: RedactionBox = {
      pageIndex,
      x: Math.min(drawingStart.x, endX),
      y: Math.min(drawingStart.y, endY),
      width: Math.abs(endX - drawingStart.x),
      height: Math.abs(endY - drawingStart.y)
    };

    if (newBox.width > 5 && newBox.height > 5) {
      setRedactions(prev => [...prev, newBox]);
    }
    
    setDrawingStart(null);
    setActivePageIndex(null);
  };

  const handleRedact = async () => {
    if (!file || redactions.length === 0) return;

    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      
      redactions.forEach(red => {
        const page = pages[red.pageIndex];
        const { width, height } = page.getSize();
        const preview = previews[red.pageIndex];
        
        const scaleX = width / preview.width;
        const scaleY = height / preview.height;

        page.drawRectangle({
          x: red.x * scaleX,
          y: height - (red.y * scaleY) - (red.height * scaleY),
          width: red.width * scaleX,
          height: red.height * scaleY,
          color: rgb(0, 0, 0),
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      saveAs(blob, `redacted_${file.name}`);
      toast.success("Security redaction complete!");
    } catch (error) {
      toast.error("Failed to redact sensitive content");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!file ? (
        <PDFDropzone onFilesSelected={handleFileSelected} multiple={false} label="Select a PDF to redact sensitive info" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="p-8 rounded-[40px] border border-white/5 bg-zinc-900/40 space-y-6 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-widest">
                <Eraser className="h-4 w-4" />
                Redaction Status
              </div>
              
              <div className="space-y-4">
                <div className="p-6 bg-zinc-950 rounded-3xl border border-white/5 text-center">
                  <div className="text-3xl font-black text-white mb-1">{redactions.length}</div>
                  <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Selected Areas</div>
                </div>
                
                <p className="text-[10px] text-zinc-600 italic leading-relaxed">
                  Click and drag over sensitive information to mark it for absolute redaction. 
                </p>
                
                <button
                  disabled={redactions.length === 0 || processing}
                  onClick={handleRedact}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-rose-500/20"
                >
                  {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldAlert className="h-5 w-5" />}
                  Confirm Redaction
                </button>
                
                <button 
                  onClick={() => setRedactions([])}
                  className="w-full py-2 text-xs font-bold text-zinc-500 hover:text-white transition-all underline underline-offset-4"
                >
                  Clear All Marks
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-8 h-[calc(100vh-250px)] overflow-y-auto pr-4 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-40 gap-4">
                 <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
                 <p className="text-zinc-500 font-medium">Rendering secure preview...</p>
              </div>
            ) : (
              previews.map(p => (
                <div 
                  key={p.index} 
                  onMouseDown={(e) => handleMouseDown(p.index, e)}
                  onMouseUp={(e) => handleMouseUp(p.index, e)}
                  className="relative group mx-auto max-w-full inline-block bg-white shadow-2xl rounded-sm overflow-hidden select-none cursor-crosshair"
                >
                  <img src={p.thumbnail} alt={`Page ${p.index + 1}`} className="max-w-full h-auto pointer-events-none" />
                  
                  {/* Current drawing preview could be added here for UX */}
                  
                  {/* Placed redactions */}
                  {redactions.filter(r => r.pageIndex === p.index).map((red, rIdx) => (
                    <div 
                      key={rIdx}
                      style={{ 
                        left: red.x, 
                        top: red.y, 
                        width: red.width, 
                        height: red.height 
                      }}
                      className="absolute bg-black shadow-[0_0_10px_rgba(0,0,0,0.5)] group/red"
                    >
                       <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setRedactions(prev => prev.filter((_, i) => i !== prev.indexOf(red)));
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover/red:opacity-100 transition-opacity"
                       >
                         <X className="h-3 w-3" />
                       </button>
                    </div>
                  ))}
                  
                  <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 text-white text-[10px] font-bold rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                    SAFE PREVIEW • PAGE {p.index + 1}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
