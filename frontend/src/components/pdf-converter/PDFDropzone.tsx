"use client";

import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";

interface PDFDropzoneProps {
  onUploadSuccess: (jobId: number) => void;
}

export default function PDFDropzone({ onUploadSuccess }: PDFDropzoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setFile(acceptedFiles[0]);
      handleUpload(acceptedFiles[0]);
    },
  });

  const handleUpload = async (fileToUpload: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", fileToUpload); 
    // Actually our PDF endpoint might expect 'file' or 'video'. 
    // Let's check backend/tools/pdf_converter/routers/upload.py.
    // It uses `file: UploadFile = File(...)`. So 'file'.

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      const response = await axios.post(`${apiBase}/api/pdf-converter/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percentCompleted);
        },
      });
      
      onUploadSuccess(response.data.id);
      toast.success("PDF uploaded successfully");
    } catch (error) {
      toast.error("Upload failed");
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full">
      {!file ? (
        <div 
          {...getRootProps()} 
          className={cn(
            "relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-12 transition-all duration-300 cursor-pointer",
            isDragActive ? "border-indigo-500 bg-indigo-500/5" : "border-[#2a2a2a] hover:border-zinc-700 bg-zinc-900/50"
          )}
        >
          <input {...getInputProps()} />
          <div className="rounded-full bg-indigo-500/10 p-6 mb-6">
            <Upload className="h-10 w-10 text-indigo-500" />
          </div>
          <p className="text-xl font-bold text-white mb-2 text-center">Drag & drop your PDF here</p>
          <p className="text-zinc-500 text-sm text-center">or click to browse files</p>
        </div>
      ) : (
        <div className="relative flex items-center gap-4 rounded-3xl border border-[#2a2a2a] bg-zinc-900/50 p-6">
          <div className="rounded-2xl bg-indigo-500/10 p-4 text-indigo-400">
            <FileText className="h-8 w-8" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white truncate">{file.name}</p>
            <p className="text-sm text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            {uploading && (
              <div className="mt-4 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
          {!uploading && (
            <button 
              onClick={() => setFile(null)}
              className="rounded-xl p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          {uploadProgress === 100 && !uploading && (
             <CheckCircle2 className="h-6 w-6 text-green-500" />
          )}
        </div>
      )}
    </div>
  );
}
