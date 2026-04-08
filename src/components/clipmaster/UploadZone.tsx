"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileVideo } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

export default function UploadZone({ onFileSelect, selectedFile }: UploadZoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    accept: {
      "video/*": [".mp4", ".mkv", ".avi", ".mov", ".webm"],
    },
    multiple: false,
  });

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={cn(
            "group relative flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#2a2a2a] bg-[#1a1a1a] transition-all hover:border-indigo-500/50 hover:bg-[#222222]",
            isDragActive && "border-indigo-500 bg-indigo-500/5"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-zinc-900 p-4 transition-transform group-hover:scale-110">
              <Upload className="h-8 w-8 text-zinc-400 group-hover:text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-white">
                Drag & drop your video here
              </p>
              <p className="text-sm text-zinc-500">
                or click to browse files
              </p>
            </div>
            <p className="text-xs text-zinc-600">
              MP4, MKV, AVI, MOV, WEBM — Max 2GB
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-indigo-500/10 p-3">
              <FileVideo className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <p className="font-medium text-white">{selectedFile.name}</p>
              <p className="text-sm text-zinc-500">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={() => onFileSelect(null)}
            className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
