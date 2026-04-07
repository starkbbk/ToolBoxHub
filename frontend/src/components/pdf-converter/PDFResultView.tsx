"use client";

import { useEffect, useState } from "react";
import { Loader2, Download, FileCheck, AlertCircle, Clock } from "lucide-react";
import axios from "axios";
import { PDFJob } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PDFResultViewProps {
  jobId: number | null;
  status: string;
}

export default function PDFResultView({ jobId, status: initialStatus }: PDFResultViewProps) {
  const [job, setJob] = useState<PDFJob | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (jobId && (initialStatus === "processing" || initialStatus === "uploaded")) {
      const fetchStatus = async () => {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        try {
          // Note: We need a detail endpoint. I'll assume we'll use a generic projects-like one.
          // For now, let's just query everything and find ours or assuming endpoints.
          // Actually let's just use the health or a specific one we'll add.
          const resp = await axios.get(`${apiBase}/api/pdf-converter/status/${jobId}`);
          setJob(resp.data);
          
          if (resp.data.status === "completed" || resp.data.status === "failed") {
            clearInterval(interval);
          }
        } catch (e) {
          console.error(e);
        }
      };

      interval = setInterval(fetchStatus, 3000);
      fetchStatus();
    }

    return () => clearInterval(interval);
  }, [jobId, initialStatus]);

  if (!jobId) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-zinc-500 text-center">
        <Clock className="h-10 w-10 mb-4 opacity-20" />
        <p className="text-sm">Upload a PDF to see results</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={cn(
        "rounded-2xl border p-4 flex items-center gap-3",
        job?.status === "completed" ? "bg-green-500/5 border-green-500/20 text-green-500" :
        job?.status === "failed" ? "bg-red-500/5 border-red-500/20 text-red-500" :
        "bg-zinc-900/50 border-zinc-800 text-zinc-400"
      )}>
        {job?.status === "processing" ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : job?.status === "completed" ? (
          <FileCheck className="h-5 w-5" />
        ) : (
          <AlertCircle className="h-5 w-5" />
        )}
        <span className="text-sm font-medium capitalize">{job?.status || initialStatus}...</span>
      </div>

      {job?.status === "completed" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-zinc-900/50 border border-[#2a2a2a]">
            <p className="text-xs text-zinc-500 mb-1">Result Type</p>
            <p className="text-sm font-bold text-white uppercase tracking-wider">{job.job_type || "Unknown"}</p>
          </div>
          
          <a 
            href={job.output_path || "#"} 
            target="_blank"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-zinc-800 text-white font-bold hover:bg-zinc-700 transition-all active:scale-[0.98]"
          >
            <Download className="h-5 w-5" />
            Download Result
          </a>
        </div>
      )}

      {job?.status === "failed" && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          {job.error_message || "An error occurred during processing."}
        </div>
      )}
    </div>
  );
}
