"use client";

import { useState } from "react";
import { 
  Wrench, 
  Download, 
  Loader2, 
  X,
  ShieldCheck,
  Zap,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import PDFDropzone from "./PDFDropzone";
import { cn } from "@/lib/utils";

export default function PDFRepair() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "completed" | "failed">("idle");
  const [resultJobId, setResultJobId] = useState<number | null>(null);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  const handleRepair = async () => {
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

      // Repair is often just a re-save/compression in pypdf
      const repairRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/pdf-converter/${jobId}/compress`, {
        method: "POST",
      });
      const repairData = await repairRes.json();
      if (repairData.status !== "success") throw new Error(repairData.message);

      pollStatus(jobId);
    } catch (error: any) {
      toast.error(error.message || "Repair failed");
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
          toast.success("PDF repaired successfully!");
        } else if (data.data.status === "failed") {
          clearInterval(interval);
          setProcessing(false);
          setStatus("failed");
          toast.error("Repair failed on server");
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
        <PDFDropzone onFilesSelected={handleFileSelected} multiple={false} label="Select a damaged PDF to repair" />
      ) : (
        <div className="space-y-8">
           <div className="flex items-center gap-6 p-8 rounded-[40px] border border-white/5 bg-zinc-950/50 backdrop-blur-xl shadow-2xl">
             <div className="h-16 w-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Wrench className="h-8 w-8 text-amber-500" />
             </div>
             <div className="flex-1 min-w-0">
               <h3 className="text-lg font-bold text-white truncate mb-1">{file.name}</h3>
               <p className="text-sm text-zinc-500">Structural integrity scan & rebuild</p>
             </div>
             <button onClick={() => { setFile(null); setStatus("idle"); }} className="p-3 text-zinc-500 hover:text-white transition-all bg-white/5 rounded-2xl">
                <X className="h-6 w-6" />
             </button>
           </div>

           {status === "idle" && (
             <div className="p-10 rounded-[40px] border border-white/5 bg-zinc-900/40 flex flex-col items-center justify-center gap-8 text-center scale-in duration-500">
                <div className="p-6 rounded-full bg-indigo-500/5 border border-indigo-500/10">
                   <Zap className="h-12 w-12 text-zinc-700" />
                </div>
                <div className="space-y-2">
                   <h4 className="text-xl font-bold text-white">Rebuild Corrupt Files</h4>
                   <p className="text-sm text-zinc-500 max-w-md mx-auto italic">
                     This tool scans for structural errors in the cross-reference table and attempts to rewrite the internal object streams. Works best for documents that open with errors.
                   </p>
                </div>
                <button
                  onClick={handleRepair}
                  className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black flex items-center gap-3 transition-all hover:scale-[1.02] shadow-xl shadow-indigo-500/20"
                >
                  <Wrench className="h-5 w-5" />
                  Start Repair Process
                </button>
             </div>
           )}

           {(status === "uploading" || status === "processing") && (
             <div className="flex flex-col items-center justify-center p-20 gap-8 bg-zinc-900/40 rounded-[40px] border border-white/5 border-dashed">
                <div className="h-24 w-24 relative">
                   <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <Wrench className="h-8 w-8 text-indigo-400 animate-bounce" />
                   </div>
                </div>
                <div className="text-center space-y-2">
                   <h4 className="text-xl font-bold text-white capitalize">{status}...</h4>
                   <p className="text-sm text-zinc-500">Restructuring document hierarchy...</p>
                </div>
             </div>
           )}

           {status === "completed" && (
             <div className="flex flex-col items-center justify-center p-20 gap-8 bg-emerald-500/5 rounded-[40px] border border-emerald-500/20 scale-in animate-in">
                <div className="h-24 w-24 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                   <CheckCircle2 className="h-12 w-12" />
                </div>
                <div className="text-center space-y-2">
                   <h4 className="text-2xl font-black text-white">Repair Successful!</h4>
                   <p className="text-sm text-zinc-500">The document structure has been rebuilt.</p>
                </div>
                <button
                  onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/pdf-converter/${resultJobId}/download`, "_blank")}
                  className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold flex items-center gap-3 transition-all hover:scale-105 shadow-xl shadow-indigo-500/20"
                >
                  <Download className="h-5 w-5" />
                  Download Repaired PDF
                </button>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
