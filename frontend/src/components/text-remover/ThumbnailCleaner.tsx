"use client";

import { useState } from "react";
import { 
  Sparkles, 
  Download, 
  Loader2, 
  Trash2, 
  CheckCircle2,
  AlertCircle,
  Zap,
  Eye,
  X
} from "lucide-react";
import { toast } from "sonner";
import PDFDropzone from "../pdf-converter/PDFDropzone";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

export default function ThumbnailCleaner() {
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setImagePreview(URL.createObjectURL(files[0]));
      setOutputImage(null);
    }
  };

  const cleanThumbnail = async () => {
    if (!file) return;
    setProcessing(true);

    try {
      // 1. Detect text regions using backend EasyOCR
      const detectData = new FormData();
      detectData.append("image", file);
      
      const detectRes = (await api.post("/api/text-remover/detect", detectData, {
        headers: { "Content-Type": "multipart/form-data" }
      })) as any;

      if (!detectRes.success) throw new Error("Detection failed");
      const regions = detectRes.data.regions;

      if (regions.length === 0) {
        toast.info("No text detected to remove.");
        setProcessing(false);
        return;
      }

      // 2. Remove all detected text using backend inpainting
      const removeData = new FormData();
      removeData.append("image", file);
      removeData.append("regions", JSON.stringify(regions));

      const removeRes = (await api.post("/api/text-remover/image", removeData, {
        headers: { "Content-Type": "multipart/form-data" }
      })) as any;

      if (!removeRes.success) throw new Error("Removal failed");

      setOutputImage(`${apiUrl}${removeRes.data.output_path}`);
      toast.success("Thumbnail cleaned with AI inpainting!");
    } catch (err) {
      console.error(err);
      toast.error("Cleanup failed. Check backend connection.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {!file ? (
        <PDFDropzone 
          onFilesSelected={handleFileSelected} 
          multiple={false} 
          accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp"] }}
          label="Drop your YouTube Thumbnail here to strip all text overlays"
        />
      ) : (
        <div className="flex flex-col items-center gap-10">
           <div className="relative group max-w-5xl w-full rounded-[3rem] border-4 border-white/10 bg-black overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] ring-1 ring-white/20">
              {/* Original (Hidden except on toggle) */}
              <img 
                src={imagePreview!} 
                alt="Original" 
                className="w-full h-auto object-contain"
              />
              
              {/* Cleaned Result (Override) */}
              {outputImage && (
                <img 
                  src={outputImage} 
                  alt="Cleaned" 
                  className={cn(
                    "absolute inset-0 w-full h-full object-contain transition-opacity duration-300",
                    showOriginal ? "opacity-0" : "opacity-100"
                  )}
                />
              )}
              
              {processing && (
                <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-2xl flex flex-col items-center justify-center gap-8 z-20">
                   <div className="relative">
                      <div className="h-32 w-32 rounded-[2.5rem] bg-indigo-500/10 border-2 border-indigo-500/30 flex items-center justify-center animate-pulse shadow-[0_0_50px_rgba(99,102,241,0.3)]">
                         <Zap className="h-16 w-16 text-indigo-400 fill-indigo-400" />
                      </div>
                      <div className="absolute -inset-4 border-2 border-indigo-500/20 rounded-[3rem] animate-[spin_6s_linear_infinite]" />
                   </div>
                   <div className="text-center space-y-4">
                      <p className="text-white font-black tracking-[0.5em] uppercase text-sm animate-pulse">STRIPPING TEXT OVERLAYS...</p>
                      <div className="w-64 h-1.5 bg-zinc-900 rounded-full overflow-hidden mx-auto border border-white/5">
                         <div className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-shimmer" style={{ width: '100%' }} />
                      </div>
                   </div>
                </div>
              )}
           </div>

           <div className="flex flex-wrap items-center justify-center gap-6 w-full">
              {!outputImage ? (
                <button
                  disabled={processing}
                  onClick={cleanThumbnail}
                  className="px-16 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-sm transition-all hover:scale-105 shadow-2xl shadow-indigo-600/40 flex items-center gap-4"
                >
                  {processing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
                  Clean Thumbnail Now
                </button>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button 
                    onMouseDown={() => setShowOriginal(true)}
                    onMouseUp={() => setShowOriginal(false)}
                    className="px-8 py-6 bg-zinc-900 hover:bg-zinc-800 text-white rounded-[1.5rem] font-bold text-xs uppercase tracking-widest transition-all border border-white/10 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Compare
                  </button>
                  
                  <button
                    onClick={() => {
                        const link = document.createElement("a");
                        link.href = outputImage!;
                        link.download = `cleaned_thumbnail_hq.png`;
                        link.click();
                    }}
                    className="px-12 py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-sm transition-all hover:scale-105 shadow-2xl shadow-emerald-500/40 flex items-center gap-4"
                  >
                    <Download className="h-6 w-6" />
                    Download PNG
                  </button>
                  
                  <button
                    onClick={() => {
                        setFile(null);
                        setOutputImage(null);
                    }}
                    className="px-8 py-6 bg-zinc-900 hover:bg-zinc-800 text-white rounded-[1.5rem] font-bold text-xs uppercase tracking-widest transition-all border border-white/10"
                  >
                    Reset
                  </button>
                </div>
              )}
           </div>

           <div className="flex flex-col items-center gap-4 opacity-50">
              <div className="flex items-center gap-3 text-zinc-400 text-xs font-black uppercase tracking-widest bg-black/40 px-8 py-4 rounded-full border border-white/5">
                 <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                 Optimized for high-contrast clickbait text
              </div>
           </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
}
