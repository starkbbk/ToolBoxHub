"use client";

import { useState, useRef, useEffect } from "react";
import * as pdfjs from "pdfjs-dist/build/pdf";
import { PDFDocument } from "pdf-lib";
import { 
  PenTool, 
  Download, 
  Loader2, 
  X,
  Plus,
  Trash2,
  Check,
  RotateCcw
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

export default function PDFSign() {
  const [file, setFile] = useState<File | null>(null);
  const [previews, setPreviews] = useState<PagePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const [signature, setSignature] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [placedSignatures, setPlacedSignatures] = useState<{
    pageIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }[]>([]);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
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
      const numPages = pdf.numPages;
      const loaded: PagePreview[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.8 });
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
      console.error(error);
      toast.error("Failed to load PDF previews");
    } finally {
      setLoading(false);
    }
  };

  // Signature Pad Logic
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ("touches" in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ("touches" in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignature(canvas.toDataURL());
    toast.success("Signature captured!");
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  const placeSignature = (pageIndex: number, e: React.MouseEvent) => {
    if (!signature) {
      toast.error("Please draw a signature first");
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setPlacedSignatures(prev => [...prev, {
      pageIndex,
      x: x - 50,
      y: y - 25,
      width: 100,
      height: 50
    }]);
  };

  const handleSave = async () => {
    if (!file || placedSignatures.length === 0) {
      toast.error("Please place at least one signature");
      return;
    }

    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      
      const sigImage = await pdfDoc.embedPng(signature!);
      
      placedSignatures.forEach(sig => {
        const page = pages[sig.pageIndex];
        const { height } = page.getSize();
        
        // Convert screen coordinates to PDF points (roughly)
        // This is a simplification; for real production, we map viewport to page size
        const preview = previews[sig.pageIndex];
        const scaleX = page.getWidth() / preview.width;
        const scaleY = page.getHeight() / preview.height;

        page.drawImage(sigImage, {
          x: sig.x * scaleX,
          y: height - (sig.y * scaleY) - (sig.height * scaleY),
          width: sig.width * scaleX,
          height: sig.height * scaleY,
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      saveAs(blob, `signed_${file.name}`);
      toast.success("Signed PDF generated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate signed PDF");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!file ? (
        <PDFDropzone onFilesSelected={handleFileSelected} multiple={false} label="Select a PDF to sign" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Controls Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-3xl border border-white/5 bg-zinc-900/40 space-y-6">
              <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Your Signature</h4>
              
              <div className="relative group aspect-video bg-zinc-950 rounded-2xl border border-white/10 overflow-hidden cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={() => setIsDrawing(false)}
                  onMouseLeave={() => setIsDrawing(false)}
                  className="w-full h-full"
                />
                {!isDrawing && !signature && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-700 text-xs font-medium">
                    Draw here
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={clearCanvas}
                  className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-2"
                >
                  <RotateCcw className="h-3 w-3" /> Clear
                </button>
                <button 
                  onClick={saveSignature}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Check className="h-3 w-3" /> Use
                </button>
              </div>

              <div className="h-px bg-white/5" />

              <div className="space-y-4">
                <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                  Drag and drop behavior: Click on any page preview to place your signature where you want it.
                </p>
                <button
                  disabled={processing || loading || placedSignatures.length === 0}
                  onClick={handleSave}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-500/10 disabled:opacity-50"
                >
                  {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                  Download Signed
                </button>
              </div>
            </div>
          </div>

          {/* PDF Preview Area */}
          <div className="lg:col-span-3 space-y-8 h-[calc(100vh-250px)] overflow-y-auto pr-4 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                <p className="text-zinc-500 font-medium">Rendering document...</p>
              </div>
            ) : (
              previews.map(p => (
                <div key={p.index} className="relative group mx-auto max-w-full inline-block bg-white shadow-2xl rounded-sm overflow-hidden cursor-copy" onClick={(e) => placeSignature(p.index, e)}>
                  <img src={p.thumbnail} alt={`Page ${p.index + 1}`} className="max-w-full h-auto select-none pointer-events-none" />
                  
                  {/* Placed Signatures on this page */}
                  {placedSignatures.filter(sig => sig.pageIndex === p.index).map((sig, sIdx) => (
                    <div 
                      key={sIdx}
                      style={{ 
                        left: sig.x, 
                        top: sig.y, 
                        width: sig.width, 
                        height: sig.height, 
                        backgroundImage: `url(${signature})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center'
                      }}
                      className="absolute border border-indigo-500/30 bg-indigo-500/5 group/sig"
                    >
                       <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlacedSignatures(prev => prev.filter((_, i) => i !== prev.indexOf(sig)));
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover/sig:opacity-100 transition-opacity"
                       >
                         <X className="h-3 w-3" />
                       </button>
                    </div>
                  ))}
                  
                  <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 text-white text-[10px] font-bold rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                    PAGE {p.index + 1}
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
