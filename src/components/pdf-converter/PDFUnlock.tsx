"use client";

import { useState } from "react";
import { 
  Unlock, 
  Download, 
  Loader2, 
  X,
  ShieldAlert,
  Eye,
  EyeOff,
  FileOutput
} from "lucide-react";
import { toast } from "sonner";
import PDFDropzone from "./PDFDropzone";
import { cn } from "@/lib/utils";

export default function PDFUnlock() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "completed">("idle");
  const [resultJobId, setResultJobId] = useState<number | null>(null);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  const handleUnlock = async () => {
    if (!file || !password) {
      toast.error("Please select a file and enter the existing password");
      return;
    }

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

      const unlockRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/pdf-converter/${jobId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const unlockData = await unlockRes.json();
      if (unlockData.status !== "success") throw new Error(unlockData.message);

      pollStatus(jobId);
    } catch (error: any) {
      toast.error(error.message || "Failed to unlock PDF. Correct password?");
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
          toast.success("PDF unlocked successfully!");
        } else if (data.data.status === "failed") {
          clearInterval(interval);
          setProcessing(false);
          setStatus("idle");
          toast.error("Unlock failed. Check your password.");
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
        <PDFDropzone onFilesSelected={handleFileSelected} multiple={false} label="Select a protected PDF to unlock" />
      ) : (
        <div className="space-y-8">
           <div className="flex items-center gap-6 p-8 rounded-[40px] border border-white/5 bg-zinc-950/50 backdrop-blur-xl shadow-2xl">
             <div className="h-16 w-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Unlock className="h-8 w-8" />
             </div>
             <div className="flex-1 min-w-0">
               <h3 className="text-lg font-bold text-white truncate mb-1">{file.name}</h3>
               <p className="text-sm text-zinc-500">Remove password protection</p>
             </div>
             <button onClick={() => { setFile(null); setStatus("idle"); }} className="p-3 text-zinc-500 hover:text-white transition-all bg-white/5 rounded-2xl">
                <X className="h-6 w-6" />
             </button>
           </div>

           {status === "idle" && (
             <div className="p-10 rounded-[40px] border border-white/5 bg-zinc-900/40 space-y-8 scale-in duration-500">
                <div className="space-y-4">
                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Current PDF Password</label>
                   <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter the document password"
                        className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-white transition-all"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                   </div>
                   <p className="text-[10px] text-zinc-600 leading-relaxed italic ml-1">
                     This will create a new version of the PDF with all security restrictions removed.
                   </p>
                </div>

                <button
                  onClick={handleUnlock}
                  disabled={!password || processing}
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-500/20 hover:scale-[1.01]"
                >
                  {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Unlock className="h-5 w-5" />}
                  Unlock PDF Permissions
                </button>
             </div>
           )}

           {(status === "uploading" || status === "processing") && (
             <div className="flex flex-col items-center justify-center p-20 gap-8 bg-zinc-900/40 rounded-[40px] border border-white/5 border-dashed">
                <div className="h-24 w-24 relative">
                   <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <ShieldAlert className="h-8 w-8 text-indigo-400" />
                   </div>
                </div>
                <div className="text-center space-y-2">
                   <h4 className="text-xl font-bold text-white capitalize">{status}...</h4>
                   <p className="text-sm text-zinc-500">Decrypting streams and rebuilding document</p>
                </div>
             </div>
           )}

           {status === "completed" && (
             <div className="flex flex-col items-center justify-center p-20 gap-8 bg-indigo-500/5 rounded-[40px] border border-indigo-500/20 scale-in animate-in">
                <div className="h-24 w-24 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                   <FileOutput className="h-12 w-12" />
                </div>
                <div className="text-center space-y-2">
                   <h4 className="text-2xl font-black text-white">Document Unlocked!</h4>
                   <p className="text-sm text-zinc-500">Password protection has been successfully removed.</p>
                </div>
                <button
                  onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/pdf-converter/${resultJobId}/download`, "_blank")}
                  className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold flex items-center gap-3 transition-all hover:scale-105 shadow-xl shadow-indigo-500/20"
                >
                  <Download className="h-5 w-5" />
                  Download Unlocked PDF
                </button>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
