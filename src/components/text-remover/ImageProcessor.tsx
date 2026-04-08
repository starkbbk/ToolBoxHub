"use client";

import { useState, useRef, useEffect } from "react";
import { 
  X, 
  Download, 
  Loader2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Eraser,
  Info,
  Sparkles,
  Zap
} from "lucide-react";
import PDFDropzone from "../pdf-converter/PDFDropzone";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import api from "@/lib/api";
import { createWorker } from 'tesseract.js';

interface TextRegion {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  selected: boolean;
  confidence: number;
}

export default function ImageProcessor() {
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imgNaturalSize, setImgNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [regions, setRegions] = useState<TextRegion[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [outputImage, setOutputImage] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<any>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Initialize Tesseract Worker
  useEffect(() => {
    const initWorker = async () => {
      const worker = await createWorker('eng');
      workerRef.current = worker;
    };
    initWorker();
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
      setRegions([]);
      setOutputImage(null);
      setImgNaturalSize(null);
      detectText(selectedFile);
    }
  };

  const detectText = async (imgFile: File) => {
    if (!workerRef.current) {
      toast.error("AI Engine starting... please wait a moment.");
      return;
    }
    setDetecting(true);
    console.log("TRACE: Starting browser-side Tesseract.js OCR...");

    try {
      const { data: { words } } = await workerRef.current.recognize(imgFile);
      
      // Analyze for overlays/bars logic
      const detected: TextRegion[] = words.map((w: any, i: number) => {
        const { x0, y0, x1, y1 } = w.bbox;
        return {
          id: `region-${i}`,
          x: x0, y: y0, w: x1 - x0, h: y1 - y0,
          text: w.text,
          confidence: w.confidence / 100,
          selected: true,
        };
      });

      setRegions(detected);
      toast.success(`OCR Complete: ${detected.length} text regions detected in browser.`);
    } catch (err) {
      console.error(err);
      toast.error("Browser OCR failed.");
    } finally {
      setDetecting(false);
    }
  };

  const removeText = async () => {
    if (!file || regions.filter(r => r.selected).length === 0) return;
    setProcessing(true);

    console.log("STEP 1: Gathering surgical mask regions from Frontend OCR...");
    try {
      const selectedRegions = regions.filter(r => r.selected).map(r => ({
        x: r.x, y: r.y, w: r.w, h: r.h
      }));

      console.log("STEP 2: Sending to Single-Worker Backend (OpenCV NS)...");
      const formData = new FormData();
      formData.append("image", file);
      formData.append("regions", JSON.stringify(selectedRegions));

      const res = (await api.post("/api/text-remover/image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })) as any;

      if (!res.success) throw new Error(res.message || "Removal failed");

      console.log("STEP 3: Reconstruction complete. Sharpened output received.");
      setOutputImage(`${apiUrl}${res.data.output_path}`);
      toast.success("Text removed surgically!");
    } catch (error) {
      console.error(error);
      toast.error("Removal failed. Deploy sync might be in progress.");
    } finally {
      setProcessing(false);
    }
  };

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number, y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number, y: number } | null>(null);
  const [manualMode, setManualMode] = useState(false);

  const startDrawing = (e: React.MouseEvent) => {
    if (!manualMode || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawStart({ x, y });
    setDrawCurrent({ x, y });
    setIsDrawing(true);
  };

  const onDrawing = (e: React.MouseEvent) => {
    if (!isDrawing || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    setDrawCurrent({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const finishDrawing = () => {
    if (!isDrawing || !drawStart || !drawCurrent || !imgNaturalSize) {
      setIsDrawing(false);
      return;
    }
    const rendered = imgRef.current!.getBoundingClientRect();
    const sx = imgNaturalSize.w / rendered.width;
    const sy = imgNaturalSize.h / rendered.height;
    
    const x = Math.min(drawStart.x, drawCurrent.x) * sx;
    const y = Math.min(drawStart.y, drawCurrent.y) * sy;
    const w = Math.abs(drawStart.x - drawCurrent.x) * sx;
    const h = Math.abs(drawStart.y - drawCurrent.y) * sy;

    if (w > 5 && h > 5) {
      setRegions(prev => [...prev, {
        id: `manual-${Date.now()}`,
        x, y, w, h,
        text: "Manual Mask",
        confidence: 1.0,
        selected: true
      }]);
    }
    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  };

  // Render scale
  const getRenderScale = () => {
    if (!imgRef.current || !imgNaturalSize) return { sx: 1, sy: 1 };
    const rect = imgRef.current.getBoundingClientRect();
    return {
      sx: rect.width / imgNaturalSize.w,
      sy: rect.height / imgNaturalSize.h
    };
  };

  const { sx, sy } = getRenderScale();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {!file ? (
        <PDFDropzone
          onFilesSelected={handleFileSelected}
          multiple={false}
          accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp"] }}
          label="Drop an image here — Browser AI will detect text locally"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-4">
            <div 
              ref={containerRef} 
              className={cn(
                "relative rounded-3xl bg-zinc-950/50 border border-white/5 overflow-hidden shadow-2xl",
                manualMode && "cursor-crosshair"
              )}
              onMouseDown={startDrawing}
              onMouseMove={onDrawing}
              onMouseUp={finishDrawing}
            >
              <img
                ref={imgRef}
                src={showOriginal ? imagePreview! : (outputImage || imagePreview!)}
                className="w-full h-auto object-contain max-h-[70vh] pointer-events-none"
                onLoad={(e) => setImgNaturalSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              />

              {isDrawing && drawStart && drawCurrent && (
                <div 
                  className="absolute border-2 border-indigo-400 bg-indigo-500/20 z-30 pointer-events-none"
                  style={{
                    left: Math.min(drawStart.x, drawCurrent.x),
                    top: Math.min(drawStart.y, drawCurrent.y),
                    width: Math.abs(drawStart.x - drawCurrent.x),
                    height: Math.abs(drawStart.y - drawCurrent.y)
                  }}
                />
              )}

              {!outputImage && !showOriginal && imgNaturalSize && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                  {regions.map(r => (
                    <div
                      key={r.id}
                      onClick={() => setRegions(prev => prev.map(reg => reg.id === r.id ? { ...reg, selected: !reg.selected } : reg))}
                      className={cn(
                        "absolute border-2 transition-all cursor-pointer group/box pointer-events-auto",
                        r.selected ? "border-indigo-500 bg-indigo-500/20" : "border-zinc-500/40 bg-transparent"
                      )}
                      style={{
                        left: r.x * sx,
                        top: r.y * sy,
                        width: r.w * sx,
                        height: r.h * sy,
                      }}
                    >
                      {r.id.startsWith("manual-") && (
                        <button onClick={(e) => { e.stopPropagation(); setRegions(prev => prev.filter(reg => reg.id !== r.id)); }} className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover/box:opacity-100 transition-opacity">
                          <X className="h-3 w-3 text-white" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {detecting && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
                  <Sparkles className="h-10 w-10 text-indigo-400 animate-pulse" />
                  <p className="text-sm font-black text-white tracking-[0.2em] uppercase">Browser-Side OCR Running...</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-4">
                {outputImage && (
                  <button onMouseDown={() => setShowOriginal(true)} onMouseUp={() => setShowOriginal(false)} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all">
                    <Eye className="h-4 w-4" /> Hold to Compare
                  </button>
                )}
              </div>
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                {regions.filter(r => r.selected).length}/{regions.length} regions selected
              </p>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-3xl bg-zinc-900/40 border border-white/5 space-y-6">
               <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Surgical Regions</h4>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">{regions.length}</span>
              </div>

              <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">
                {regions.map((r, i) => (
                  <div key={r.id} onClick={() => setRegions(prev => prev.map(reg => reg.id === r.id ? { ...reg, selected: !reg.selected } : reg))} className={cn("p-3 rounded-xl border text-xs cursor-pointer transition-all font-medium", r.selected ? "bg-indigo-600/20 border-indigo-500/50 text-white" : "bg-zinc-900 border-white/5 text-zinc-500")}>
                    <span className="truncate block">&ldquo;{r.text}&rdquo;</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setManualMode(!manualMode)} className={cn("flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border", manualMode ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20" : "bg-zinc-800 border-white/5 text-zinc-500")}>
                  {manualMode ? "Drawing On" : "Draw Mask"}
                </button>
                <button disabled={detecting || processing} onClick={() => file && detectText(file)} className="flex-1 py-2.5 bg-zinc-800 border border-white/5 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                  Rescan
                </button>
              </div>

              <div className="pt-2 border-t border-white/5">
                {!outputImage ? (
                  <button disabled={detecting || processing || regions.filter(r => r.selected).length === 0} onClick={removeText} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 text-xs uppercase tracking-widest">
                    {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Eraser className="h-5 w-5" />}
                    Surgical Inpaint
                  </button>
                ) : (
                  <div className="space-y-3">
                    <button onClick={() => { const link = document.createElement("a"); link.href = outputImage!; link.download = `cleaned_${file?.name}`; link.click(); }} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                      <Download className="h-5 w-5" /> Download Result
                    </button>
                    <button onClick={() => { setFile(null); setImagePreview(null); setRegions([]); setOutputImage(null); }} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                      <Trash2 className="h-4 w-4" /> Reset
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-5 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3">
              <Zap className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
              <p className="text-[10px] text-zinc-400 leading-relaxed font-bold">
                RENDER MEMORY OPTIMIZED: OCR processing is now happening in your browser to save cloud resources.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
