"use client";

import { useState, useRef } from "react";
import { 
  X, 
  Download, 
  Loader2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Eraser,
  Info,
  Sparkles
} from "lucide-react";
import PDFDropzone from "../pdf-converter/PDFDropzone";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import api from "@/lib/api";

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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
    setDetecting(true);
    try {
      const formData = new FormData();
      formData.append("image", imgFile);

      // Use shared api instance instead of fetch
      const res = (await api.post("/api/text-remover/detect", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })) as any;

      if (!res.success) throw new Error(res.message || "Detection failed");

      const detected: TextRegion[] = res.data.regions.map((r: any, i: number) => ({
        id: `region-${i}`,
        x: r.x, y: r.y, w: r.w, h: r.h,
        text: r.text,
        confidence: r.confidence,
        selected: true,
      }));

      setRegions(detected);
      toast.success(`Detected ${detected.length} text regions.`);
    } catch (err) {
      console.error(err);
      toast.error("Text detection failed. Is the backend running?");
    } finally {
      setDetecting(false);
    }
  };

  const toggleRegion = (id: string) => {
    setRegions(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  };

  // Scale from image natural pixel coordinates → rendered pixel coordinates on screen
  const getScale = () => {
    if (!imgRef.current || !imgNaturalSize) return { sx: 1, sy: 1 };
    const rendered = imgRef.current.getBoundingClientRect();
    return {
      sx: rendered.width / imgNaturalSize.w,
      sy: rendered.height / imgNaturalSize.h,
    };
  };

  const removeText = async () => {
    if (!imagePreview || regions.filter(r => r.selected).length === 0) return;
    setProcessing(true);

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = imagePreview;

      await new Promise((resolve) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          resolve(null);
        };
      });

      if (!ctx) return;

      const selectedRegions = regions.filter(r => r.selected);

      for (const r of selectedRegions) {
        const margin = 6;
        const sx = Math.max(0, r.x - margin);
        const sy = Math.max(0, r.y - margin);
        const sw = r.w + margin * 2;
        const sh = r.h + margin * 2;
        const sampleData = ctx.getImageData(sx, sy, sw, sh);
        ctx.fillStyle = getAverageEdgeColor(sampleData);
        ctx.fillRect(r.x, r.y, r.w, r.h);
        addSubtleNoise(ctx, r.x, r.y, r.w, r.h);
      }

      setOutputImage(canvas.toDataURL("image/png"));
      toast.success("Text removed successfully!");
    } catch (error) {
      toast.error("Removal failed.");
    } finally {
      setProcessing(false);
    }
  };

  const getAverageEdgeColor = (imageData: ImageData) => {
    const data = imageData.data;
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
    }
    return `rgb(${Math.floor(r / count)}, ${Math.floor(g / count)}, ${Math.floor(b / count)})`;
  };

  const addSubtleNoise = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = `rgba(128,128,128,${Math.random() * 0.05})`;
      ctx.fillRect(x + Math.random() * w, y + Math.random() * h, 1, 1);
    }
  };

  const { sx, sy } = getScale();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {!file ? (
        <PDFDropzone
          onFilesSelected={handleFileSelected}
          multiple={false}
          accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp"] }}
          label="Drop an image here — AI will detect all text regions automatically"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Preview */}
          <div className="lg:col-span-3 space-y-4">
            <div ref={containerRef} className="relative rounded-3xl bg-zinc-950/50 border border-white/5 overflow-hidden shadow-2xl">
              <img
                ref={imgRef}
                src={showOriginal ? imagePreview! : (outputImage || imagePreview!)}
                alt="Preview"
                className="w-full h-auto object-contain max-h-[70vh]"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
                }}
              />

              {/* Bounding boxes overlay */}
              {!outputImage && !showOriginal && imgNaturalSize && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                  {regions.map(r => {
                    // Position boxes relative to the rendered image
                    const renderedLeft = r.x * sx;
                    const renderedTop = r.y * sy;
                    const renderedW = r.w * sx;
                    const renderedH = r.h * sy;

                    return (
                      <div
                        key={r.id}
                        onClick={() => toggleRegion(r.id)}
                        className={cn(
                          "absolute border-2 transition-all cursor-pointer group/box pointer-events-auto",
                          r.selected
                            ? "border-indigo-500 bg-indigo-500/20"
                            : "border-zinc-500/40 bg-transparent hover:border-zinc-400"
                        )}
                        style={{
                          left: renderedLeft,
                          top: renderedTop,
                          width: renderedW,
                          height: renderedH,
                        }}
                      >
                        <div className="absolute -top-6 left-0 bg-indigo-700 text-[9px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover/box:opacity-100 whitespace-nowrap z-20 pointer-events-none">
                          {r.text} ({Math.round(r.confidence * 100)}%)
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {detecting && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
                  <Sparkles className="h-10 w-10 text-indigo-400 animate-pulse" />
                  <p className="text-sm font-black text-white tracking-[0.2em] uppercase animate-pulse">AI Scanning Text...</p>
                  <p className="text-xs text-zinc-400">Using EasyOCR deep learning model</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-4">
                {outputImage && (
                  <button
                    onMouseDown={() => setShowOriginal(true)}
                    onMouseUp={() => setShowOriginal(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    {showOriginal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    Hold to Compare
                  </button>
                )}
              </div>
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                {regions.filter(r => r.selected).length}/{regions.length} regions selected
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-3xl bg-zinc-900/40 border border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Detected Text</h4>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">{regions.length} found</span>
              </div>

              <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">
                {regions.map((r, i) => (
                  <div
                    key={r.id}
                    onClick={() => toggleRegion(r.id)}
                    className={cn(
                      "p-3 rounded-xl border text-xs cursor-pointer transition-all font-medium",
                      r.selected
                        ? "bg-indigo-600/20 border-indigo-500/50 text-white"
                        : "bg-zinc-900 border-white/5 text-zinc-500 hover:border-white/20"
                    )}
                  >
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-0.5">Region #{i + 1}</span>
                    <span className="truncate block">&ldquo;{r.text}&rdquo;</span>
                  </div>
                ))}
                {regions.length === 0 && !detecting && (
                  <p className="text-center text-zinc-600 text-xs py-8">No text detected yet</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  disabled={detecting || processing}
                  onClick={() => setRegions(regions.map(r => ({ ...r, selected: true })))}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  All
                </button>
                <button
                  disabled={detecting || processing}
                  onClick={() => setRegions(regions.map(r => ({ ...r, selected: false })))}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  None
                </button>
                <button
                  disabled={detecting || processing}
                  onClick={() => file && detectText(file)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Rescan
                </button>
              </div>

              <div className="pt-2 border-t border-white/5">
                {!outputImage ? (
                  <button
                    disabled={detecting || processing || regions.filter(r => r.selected).length === 0}
                    onClick={removeText}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 text-xs uppercase tracking-widest"
                  >
                    {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Eraser className="h-5 w-5" />}
                    Remove Selected
                  </button>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = outputImage!;
                        link.download = `cleaned_${file?.name}`;
                        link.click();
                      }}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                    >
                      <Download className="h-5 w-5" />
                      Download Cleaned
                    </button>
                    <button
                      onClick={() => { setFile(null); setImagePreview(null); setRegions([]); setOutputImage(null); }}
                      className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" /> Start Over
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3">
              <Info className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                <b>PRO TIP:</b> Click any highlighted box to toggle that word for removal. Use &lsquo;Rescan&rsquo; to re-run AI detection.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
