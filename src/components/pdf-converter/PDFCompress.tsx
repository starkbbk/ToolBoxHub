"use client";

import { useState, useEffect } from "react";
import { 
  Zap, 
  Download, 
  Loader2, 
  X,
  FileCheck,
  Minimize2,
  TrendingDown
} from "lucide-react";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import PDFDropzone from "./PDFDropzone";
import { cn } from "@/lib/utils";

export default function PDFCompress() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [resultJobId, setResultJobId] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "completed" | "failed">("idle");

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const startCompression = async () => {
    if (!file) return;

    setProcessing(true);
    setStatus("uploading");
    
    try {
      // Step 1: Upload
      const formData = new FormData();
      formData.append("file", file);
      
      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/pdf-converter/upload`, {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      
      if (uploadData.status !== "success") throw new Error(uploadData.message);
      const jobId = uploadData.data.job_id;

      // Step 2: Trigger Compression
      setStatus("processing");
      const compressRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/pdf-converter/${jobId}/compress`, {
        method: "POST",
      });
      const compressData = await compressRes.json();
      if (compressData.status !== "success") throw new Error(compressData.message);

      // Step 3: Poll for completion
      pollStatus(jobId);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Compression failed");
      setProcessing(false);
      setStatus("failed");
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
          toast.success("PDF compressed successfully!");
        } else if (data.data.status === "failed") {
          clearInterval(interval);
          setStatus("failed");
          setProcessing(false);
          toast.error("Process failed on server");
        }
      } catch (err) {
        clearInterval(interval);
        setProcessing(false);
        setStatus("failed");
      }
    }, 2000);
  };

  const downloadResult = () => {
    if (!resultJobId) return;
    window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/pdf-converter/${resultJobId}/download`, "_blank");
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!file ? (
        <PDFDropzone onFilesSelected={handleFileSelected} multiple={false} label="Select a PDF to compress" />
      ) : (
        <div className="space-y-8">
           {/* File Info Card */}
           <div className="flex items-center gap-6 p-8 rounded-[40px] border border-white/5 bg-zinc-950/50 backdrop-blur-xl shadow-2xl scale-in duration-500">
             <div className="h-16 w-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Minimize2 className="h-8 w-8" />
             </div>
             <div className="flex-1 min-w-0">
               <h3 className="text-lg font-bold text-white truncate mb-1">{file.name}</h3>
               <p className="text-sm text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready to shrink</p>
             </div>
             <button onClick={() => { setFile(null); setStatus("idle"); }} className="p-3 text-zinc-500 hover:text-white transition-all bg-white/5 rounded-2xl">
                <X className="h-6 w-6" />
             </button>
           </div>

           {status === "idle" && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={startCompression}
                  className="group relative overflow-hidden p-8 rounded-[32px] bg-indigo-600 hover:bg-indigo-500 text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-indigo-500/20"
                >
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <Zap className="h-10 w-10 fill-white" />
                    <div className="text-center">
                      <h4 className="font-black text-xl mb-1 mt-2">Extreme Compress</h4>
                      <p className="text-xs text-indigo-100/70">Reduce file size as much as possible</p>
                    </div>
                  </div>
                </button>

                <div className="p-8 rounded-[32px] border border-white/5 bg-zinc-900/30 flex flex-col items-center justify-center gap-4 text-center">
                   <TrendingDown className="h-8 w-8 text-zinc-600" />
                   <div className="space-y-1">
                      <h4 className="font-bold text-zinc-400">Smart Optimization</h4>
                      <p className="text-xs text-zinc-500 max-w-[200px]">We'll clean internal streams to optimize without quality loss.</p>
                   </div>
                </div>
             </div>
           )}

           {(status === "uploading" || status === "processing") && (
             <div className="flex flex-col items-center justify-center p-20 gap-8 bg-zinc-900/40 rounded-[40px] border border-white/5 border-dashed">
                <div className="h-24 w-24 relative">
                   <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="h-8 w-8 text-indigo-400 animate-pulse" />
                   </div>
                </div>
                <div className="text-center space-y-2">
                   <h4 className="text-xl font-bold text-white capitalize">{status}...</h4>
                   <p className="text-sm text-zinc-500">Shrinking your document in the cloud</p>
                </div>
             </div>
           )}

           {status === "completed" && (
             <div className="flex flex-col items-center justify-center p-20 gap-8 bg-indigo-500/5 rounded-[40px] border border-indigo-500/20 scale-in animate-in">
                <div className="h-24 w-24 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                   <FileCheck className="h-12 w-12" />
                </div>
                <div className="text-center space-y-2">
                   <h4 className="text-2xl font-black text-white">Compression Complete!</h4>
                   <p className="text-sm text-zinc-500">Your PDF is now thinner and faster.</p>
                </div>
                <button
                  onClick={downloadResult}
                  className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold flex items-center gap-3 transition-all hover:scale-105 shadow-xl shadow-indigo-500/20"
                >
                  <Download className="h-5 w-5" />
                  Download Compressed PDF
                </button>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
