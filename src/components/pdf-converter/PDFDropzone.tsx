"use client";

import { useDropzone, Accept } from "react-dropzone";
import { Upload, FileText, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PDFDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: Accept;
  maxFiles?: number;
  multiple?: boolean;
  label?: string;
  className?: string;
}

export default function PDFDropzone({ 
  onFilesSelected, 
  accept = { "application/pdf": [".pdf"] },
  maxFiles = 0, // 0 means no limit
  multiple = true,
  label = "Drag & drop your files here",
  className
}: PDFDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxFiles: maxFiles || undefined,
    maxSize: 50 * 1024 * 1024, // 50MB limit
    multiple,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles);
      }
    },
    onDropRejected: (fileRejections) => {
      fileRejections.forEach((rejection) => {
        toast.error(`${rejection.file.name}: ${rejection.errors[0].message}`);
      });
    }
  });

  return (
    <div 
      {...getRootProps()} 
      className={cn(
        "relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-12 transition-all duration-300 cursor-pointer",
        "liquid-glass",
        isDragActive ? "border-indigo-500 bg-indigo-500/10 scale-[1.02]" : "border-border hover:border-primary/50 hover:bg-primary/5",
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="rounded-full bg-indigo-500/10 p-6 mb-6">
        <Upload className="h-10 w-10 text-indigo-500 animate-bounce" />
      </div>
      <p className="text-xl font-bold text-foreground mb-2 text-center">{label}</p>
      <p className="text-muted-foreground text-sm text-center">or click to browse files</p>
      
      {/* Decorative corners */}
      <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-border/50 rounded-tl-lg" />
      <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-border/50 rounded-tr-lg" />
      <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-border/50 rounded-bl-lg" />
      <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-border/50 rounded-br-lg" />
    </div>
  );
}
