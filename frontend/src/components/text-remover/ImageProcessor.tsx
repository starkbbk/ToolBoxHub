"use client";

import { useState, useRef, useEffect } from "react";
import { 
  X, 
  Download, 
  Loader2, 
  Trash2, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  MousePointer2,
  Eraser,
  Info
} from "lucide-react";
import { createWorker } from "tesseract.js";
import PDFDropzone from "../pdf-converter/PDFDropzone";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TextRegion {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  selected: boolean;
}

export default function ImageProcessor() {
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [regions, setRegions] = useState<TextRegion[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [outputImage, setOutputImage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
      setRegions([]);
      setOutputImage(null);
      detectText(selectedFile);
    }
  };

  const detectText = async (imgFile: File) => {
    setDetecting(true);
    try {
      const worker = await createWorker('eng');
      const result = await worker.recognize(imgFile);
      const data = result.data as any;
      const words = data.words || [];
      
      const detectedRegions: TextRegion[] = words
        .filter((word: any) => word.confidence > 50)
        .map((word: any, index: number) => ({
          id: `region-${index}`,
          x: word.bbox.x0,
          y: word.bbox.y0,
          w: word.bbox.x1 - word.bbox.x0,
          h: word.bbox.y1 - word.bbox.y0,
          text: word.text,
          selected: true
        }));

      setRegions(detectedRegions);
      await worker.terminate();
      toast.success(`Detected ${detectedRegions.length} text regions.`);
    } catch (err) {
      toast.error("Text detection failed.");
      console.error(err);
    } finally {
      setDetecting(false);
    }
  };

  const toggleRegion = (id: string) => {
    setRegions(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
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
        const margin = 5;
        const sampleArea = ctx.getImageData(
          Math.max(0, r.x - margin), 
          Math.max(0, r.y - margin), 
          r.w + (margin * 2), 
          r.h + (margin * 2)
        );
        
        ctx.fillStyle = getAverageEdgeColor(sampleArea);
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
      r += data[i];
      g += data[i+1];
      b += data[i+2];
      count++;
    }
    return `rgb(${Math.floor(r/count)}, ${Math.floor(g/count)}, ${Math.floor(b/count)})`;
  };

  const addSubtleNoise = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    for (let i = 0; i < 100; i++) {
        const nx = x + Math.random() * w;
        const ny = y + Math.random() * h;
        ctx.fillStyle = `rgba(128,128,128,${Math.random() * 0.05})`;
        ctx.fillRect(nx, ny, 1, 1);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {!file ? (
        <PDFDropzone 
          onFilesSelected={handleFileSelected} 
          multiple={false} 
          accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp"] }}
          label="Drop an image here to remove text"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Preview Area */}
          <div className="lg:col-span-3 space-y-4">
            <div className="relative rounded-3xl bg-zinc-950/50 border border-white/5 overflow-hidden shadow-2xl group">
               <img 
                 src={showOriginal ? imagePreview! : (outputImage || imagePreview!)} 
                 alt="Preview" 
                 className="w-full h-auto object-contain max-h-[70vh]"
               />
               
               {!outputImage && !showOriginal && (
                 <div className="absolute inset-0 z-10">
                    {regions.map(r => (
                      <div 
                        key={r.id}
                        onClick={() => toggleRegion(r.id)}
                        className={cn(
                          "absolute border-2 transition-all cursor-pointer group/box",
                          r.selected 
                            ? "border-indigo-500 bg-indigo-500/20" 
                            : "border-zinc-500/30 bg-transparent hover:border-zinc-400"
                        )}
                        style={{ left: `${(r.x / 10)}%`, top: `${(r.y / 10)}%`, width: `${(r.w / 10)}%`, height: `${(r.h / 10)}%` }}
                      >
                         <div className="absolute -top-6 left-0 bg-indigo-600 text-[10px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover/box:opacity-100 whitespace-nowrap">
                            Click to toggle removal
                         </div>
                      </div>
                    ))}
                 </div>
               )}

               {detecting && (
                 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
                    <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                    <p className="text-sm font-bold text-white tracking-widest animate-pulse">DETECTING TEXT...</p>
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
                      Hold to View Original
                    </button>
                  )}
               </div>
               <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                  {regions.length} items detected
               </p>
            </div>
          </div>

          {/* Sidebar Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-3xl bg-zinc-900/40 border border-white/5 space-y-6">
               <h4 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Actions</h4>
               
               <div className="space-y-3">
                  <button 
                    disabled={detecting || processing}
                    onClick={() => setRegions(regions.map(r => ({ ...r, selected: true })))}
                    className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    Select All
                  </button>
                  <button 
                    disabled={detecting || processing}
                    onClick={() => setRegions(regions.map(r => ({ ...r, selected: false })))}
                    className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    Deselect All
                  </button>
               </div>

               <div className="pt-4 border-t border-white/5">
                 {!outputImage ? (
                   <button 
                     disabled={detecting || processing || regions.filter(r => r.selected).length === 0}
                     onClick={removeText}
                     className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                   >
                     {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Eraser className="h-5 w-5" />}
                     Remove Selected Text
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
                       className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2"
                     >
                       <Download className="h-5 w-5" />
                       Download Cleaned
                     </button>
                     <button 
                       onClick={() => handleFileSelected([])} // Reset
                       className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                     >
                       <Trash2 className="h-4 w-4" />
                       Start Over
                     </button>
                   </div>
                 )}
               </div>
            </div>

            <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3">
               <Info className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
               <p className="text-[10px] text-zinc-400 leading-relaxed italic">
                 <b>PRO TIP:</b> Click on the detected boxes in the preview to toggle specific lines for removal.
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
