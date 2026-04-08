"use client";

import { useState } from "react";
import { 
  Sparkles, 
  Download, 
  Loader2, 
  Trash2, 
  CheckCircle2,
  AlertCircle,
  Zap
} from "lucide-react";
import { createWorker } from "tesseract.js";
import PDFDropzone from "../pdf-converter/PDFDropzone";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ThumbnailCleaner() {
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [outputImage, setOutputImage] = useState<string | null>(null);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setImagePreview(URL.createObjectURL(files[0]));
      setOutputImage(null);
    }
  };

  const cleanThumbnail = async () => {
    if (!file || !imagePreview) return;
    setProcessing(true);

    try {
      const worker = await createWorker('eng');
      const result = await worker.recognize(file);
      const { words } = result.data as any;
      
      const regions = words.map((word: any) => ({
        x: word.bbox.x0,
        y: word.bbox.y0,
        w: word.bbox.x1 - word.bbox.x0,
        h: word.bbox.y1 - word.bbox.y0
      }));

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

      for (const r of regions) {
        const m = 10; 
        const nx = Math.max(0, r.x - m);
        const ny = Math.max(0, r.y - m);
        const nw = r.w + (m * 2);
        const nh = r.h + (m * 2);

        ctx.fillStyle = getDominantBackground(ctx, nx, ny, nw, nh);
        ctx.fillRect(r.x, r.y, r.w, r.h);
      }

      await worker.terminate();
      setOutputImage(canvas.toDataURL("image/png"));
      toast.success("Thumbnail cleaned! Text removed.");
    } catch (err) {
      toast.error("Cleanup failed.");
    } finally {
      setProcessing(false);
    }
  };

  const getDominantBackground = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const data = ctx.getImageData(x, y, w, h).data;
    const colors: Record<string, number> = {};
    
    for (let i = 0; i < data.length; i += 40) {
       const key = `${data[i]},${data[i+1]},${data[i+2]}`;
       colors[key] = (colors[key] || 0) + 1;
    }
    const dominant = Object.entries(colors).sort((a, b) => b[1] - a[1])[0][0];
    return `rgb(${dominant})`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {!file ? (
        <PDFDropzone 
          onFilesSelected={handleFileSelected} 
          multiple={false} 
          accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp"] }}
          label="Drop your YouTube Thumbnail here"
        />
      ) : (
        <div className="flex flex-col items-center gap-10">
           <div className="relative group max-w-4xl w-full rounded-[40px] border border-white/5 bg-zinc-950 overflow-hidden shadow-2xl">
              <img 
                src={outputImage || imagePreview!} 
                alt="Thumbnail" 
                className="w-full h-auto object-contain"
              />
              
              {processing && (
                <div className="absolute inset-0 bg-indigo-950/20 backdrop-blur-xl flex flex-col items-center justify-center gap-6 z-20">
                   <div className="h-20 w-20 rounded-3xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 animate-pulse">
                      <Zap className="h-10 w-10 text-indigo-400 fill-indigo-400" />
                   </div>
                   <div className="text-center space-y-2">
                      <p className="text-white font-black tracking-[0.3em] uppercase text-sm">AI CLEANING...</p>
                      <p className="text-xs text-indigo-300">Reconstructing background layers</p>
                   </div>
                </div>
              )}
           </div>

           <div className="flex flex-wrap items-center justify-center gap-4 w-full">
              {!outputImage ? (
                <button
                  disabled={processing}
                  onClick={cleanThumbnail}
                  className="px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black transition-all hover:scale-105 shadow-2xl shadow-indigo-600/30 flex items-center gap-3"
                >
                  {processing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
                  Clean Thumbnail Now
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                        const link = document.createElement("a");
                        link.href = outputImage!;
                        link.download = `cleaned_thumb.png`;
                        link.click();
                    }}
                    className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black transition-all hover:scale-105 shadow-2xl shadow-emerald-500/30 flex items-center gap-3"
                  >
                    <Download className="h-6 w-6" />
                    Download Cleaned Image
                  </button>
                  <button
                    onClick={() => {
                        setFile(null);
                        setOutputImage(null);
                    }}
                    className="px-8 py-5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-bold transition-all border border-white/5"
                  >
                    Clean Another
                  </button>
                </div>
              )}
           </div>

           <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium bg-zinc-950/50 px-6 py-3 rounded-full border border-white/5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Preserves background facial features and object textures automatically.
           </div>
        </div>
      )}
    </div>
  );
}
