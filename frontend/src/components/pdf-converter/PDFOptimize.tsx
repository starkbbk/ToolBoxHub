"use client";

import { useState } from "react";
import { 
  Rocket, 
  Download, 
  Loader2, 
  X,
  Gauge,
  CheckCircle2,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import PDFDropzone from "./PDFDropzone";
import { cn } from "@/lib/utils";

export default function PDFOptimize() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "completed">("idle");
  const [resultJobId, setResultJobId] = useState<number | null>(null);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  const handleOptimize = async () => {
    if (!file) return;

    setProcessing(true);
    setStatus("uploading");
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/pdf-converter/upload`, {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (uploadData.status !== "success") throw new Error(uploadData.message);
      
      const jobId = uploadData.data.job_id;
      setStatus("processing");

      const optimizeRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/pdf-converter/${jobId}/compress`, {
        method: "POST",
      });
      const optimizeData = await optimizeRes.json();
      if (optimizeData.status !== "success") throw new Error(optimizeData.message);

      pollStatus(jobId);
    } catch (error: any) {
      toast.error(error.message || "Optimization failed");
      setProcessing(false);
      setStatus("idle");
    }
  };

  const pollStatus = async (jobId: number) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/pdf-converter/${jobId}`);
        const data = await res.json();
        if (data.data.status === "completed") {
          clearInterval(interval);
          setResultJobId(jobId);
          setStatus("completed");
          setProcessing(false);
          toast.success("PDF optimized successfully!");
        } else if (data.data.status === "failed") {
          clearInterval(interval);
          setProcessing(false);
          setStatus("idle");
          toast.error("Optimization failed on server");
        }
      } catch (err) {
        clearInterval(interval);
        setProcessing(false);
      }
    }, 2000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!file ? (
        <PDFDropzone onFilesSelected={handleFileSelected} multiple={false} label="Select a PDF to optimize for web" />
      ) : (
        <div className="space-y-8">
           <div className="flex items-center gap-6 p-8 rounded-[40px] border border-white/5 bg-zinc-950/50 backdrop-blur-xl shadow-2xl">
             <div className="h-16 w-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Rocket className="h-8 w-8 text-indigo-500" />
             </div>
             <div className="flex-1 min-w-0">
               <h3 className="text-lg font-bold text-white truncate mb-1">{file.name}</h3>
               <p className="text-sm text-zinc-500">Optimize for web delivery & structural clean</p>
             </div>
             <button onClick={() => { setFile(null); setStatus("idle"); }} className="p-3 text-zinc-500 hover:text-white transition-all bg-white/5 rounded-2xl">
                <X className="h-6 w-6" />
             </button>
           </div>

           {status === "idle" && (
             <div className="p-10 rounded-[40px] border border-white/5 bg-zinc-900/40 flex flex-col items-center justify-center gap-8 text-center scale-in duration-500">
                <div className="flex gap-4">
                   <div className="p-4 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
                      <Gauge className="h-10 w-10 text-indigo-400/50" />
                   </div>
                   <div className="p-4 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
                      <Activity className="h-10 w-10 text-indigo-400/50" />
                   </div>
                </div>
                <div className="space-y-2">
                   <h4 className="text-xl font-bold text-white">Smart PDF Optimization</h4>
                   <p className="text-sm text-zinc-500 max-w-md mx-auto">
                     We'll strip unreferenced objects, linearize the file for fast web viewing, and compress font streams without affecting text quality.
                   </p>
                </div>
                <button
                  onClick={handleOptimize}
                  className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black flex items-center gap-3 transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                >
                  <Rocket className="h-5 w-5" />
                  Optimize Document
                </button>
             </div>
           )}

           {(status === "uploading" || status === "processing") && (
             <div className="flex flex-col items-center justify-center p-20 gap-8 bg-zinc-900/40 rounded-[40px] border border-white/5 border-dashed">
                <div className="h-24 w-24 relative">
                   <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <Rocket className="h-8 w-8 text-indigo-400 animate-pulse" />
                   </div>
                </div>
                <div className="text-center space-y-2">
                   <h4 className="text-xl font-bold text-white capitalize">{status}...</h4>
                   <p className="text-sm text-zinc-500">Linearizing and rebuilding for speed...</p>
                </div>
             </div>
           )}

           {status === "completed" && (
             <div className="flex flex-col items-center justify-center p-20 gap-8 bg-emerald-500/5 rounded-[40px] border border-emerald-500/20 scale-in animate-in">
                <div className="h-24 w-24 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                   <CheckCircle2 className="h-12 w-12" />
                </div>
                <div className="text-center space-y-2">
                   <h4 className="text-2xl font-black text-white">Optimization Complete!</h4>
                   <p className="text-sm text-zinc-500">Your PDF is now lean and web-ready.</p>
                </div>
                <button
                  onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/pdf-converter/${resultJobId}/download`, "_blank")}
                  className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold flex items-center gap-3 transition-all hover:scale-105 shadow-xl shadow-indigo-500/20"
                >
                  <Download className="h-5 w-5" />
                  Download Optimized PDF
                </button>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
