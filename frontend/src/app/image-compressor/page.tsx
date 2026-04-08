"use client";

import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import PDFDropzone from "@/components/pdf-converter/PDFDropzone";
import { 
  Image as ImageIcon, 
  Download, 
  Loader2, 
  X, 
  Zap,
  CheckCircle2,
  Archive,
  Settings2,
  Maximize2,
  ChevronRight
} from "lucide-react";
import imageCompression from "browser-image-compression";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CompressedImage {
  id: string;
  originalName: string;
  originalSize: number;
  compressedSize: number;
  blob: Blob;
  preview: string;
}

export default function ImageCompressorPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState(0.8);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [results, setResults] = useState<CompressedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingIndex, setProcessingIndex] = useState(-1);

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const compressImages = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    const newResults: CompressedImage[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        setProcessingIndex(i);
        const file = files[i];
        
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: maxWidth,
          useWebWorker: true,
          initialQuality: quality,
        };

        const compressedFile = await imageCompression(file, options);
        
        newResults.push({
          id: Math.random().toString(36).substr(2, 9),
          originalName: file.name,
          originalSize: file.size,
          compressedSize: compressedFile.size,
          blob: compressedFile,
          preview: URL.createObjectURL(compressedFile),
        });
      }

      setResults(newResults);
      setFiles([]);
      toast.success(`Successfully compressed ${newResults.length} images`);
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during compression.");
    } finally {
      setIsProcessing(false);
      setProcessingIndex(-1);
    }
  };

  const downloadAll = async () => {
    if (results.length === 0) return;

    if (results.length === 1) {
      saveAs(results[0].blob, `compressed_${results[0].originalName}`);
      return;
    }

    const zip = new JSZip();
    results.forEach((img) => {
      zip.file(`compressed_${img.originalName}`, img.blob);
    });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "compressed_images.zip");
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4">
      <PageHeader
        icon="🖼️"
        title="Image Compressor"
        description="Optimize your images without losing quality. Fast, private, and entirely in your browser."
      />

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {!files.length && !results.length ? (
            <PDFDropzone 
              onFilesSelected={handleFilesSelected} 
              accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp"] }}
              label="Select images to compress"
              className="h-[400px]"
            />
          ) : results.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  Compressed Results ({results.length})
                </h3>
                <button 
                  onClick={() => {
                    results.forEach(r => URL.revokeObjectURL(r.preview));
                    setResults([]);
                  }}
                  className="text-sm text-zinc-500 hover:text-rose-400 transition-colors"
                >
                  Start over
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {results.map((img) => {
                  const reduction = Math.round(((img.originalSize - img.compressedSize) / img.originalSize) * 100);
                  return (
                    <motion.div 
                      key={img.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group flex flex-wrap sm:flex-nowrap items-center gap-4 rounded-3xl border border-white/5 bg-zinc-900/40 p-4 hover:bg-zinc-900/60 transition-all backdrop-blur-sm"
                    >
                      <div className="h-20 w-20 rounded-2xl overflow-hidden bg-zinc-800 shrink-0 border border-white/5">
                        <img src={img.preview} alt="Compressed" className="h-full w-full object-cover" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate">{img.originalName}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-zinc-500 text-sm line-through">{formatSize(img.originalSize)}</span>
                          <ChevronRight className="h-3 w-3 text-zinc-600" />
                          <span className="text-emerald-400 text-sm font-bold">{formatSize(img.compressedSize)}</span>
                          {reduction > 0 && (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-black">
                              -{reduction}%
                            </span>
                          )}
                        </div>
                      </div>

                      <button 
                        onClick={() => saveAs(img.blob, `compressed_${img.originalName}`)}
                        className="ml-auto p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all hover:scale-105 active:scale-95"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-indigo-400" />
                  Selected Images ({files.length})
                </h3>
                <button 
                  onClick={() => setFiles([])}
                  className="text-sm text-zinc-500 hover:text-rose-400 transition-colors"
                >
                  Clear all
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <AnimatePresence mode="popLayout">
                  {files.map((file, index) => (
                    <motion.div
                      key={`${file.name}-${index}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-zinc-900/40 p-4 hover:bg-zinc-900/60 transition-colors"
                    >
                      <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-400">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{file.name}</p>
                        <p className="text-xs text-zinc-500">{formatSize(file.size)}</p>
                      </div>
                      <button 
                        onClick={() => removeFile(index)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-rose-400 rounded-xl transition-all"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    if (target.files) {
                      handleFilesSelected(Array.from(target.files));
                    }
                  };
                  input.click();
                }}
                className="w-full py-6 border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center gap-2 text-zinc-500 hover:text-white hover:border-white/10 hover:bg-white/5 transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-xl">+</span>
                </div>
                <span className="font-medium">Add more images</span>
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-3xl border border-white/10 bg-zinc-900/80 p-8 backdrop-blur-xl shadow-2xl space-y-8">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-indigo-400" />
              Compression Settings
            </h4>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Quality</span>
                  <span className="text-white font-bold">{Math.round(quality * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1.0" 
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-600 uppercase font-black tracking-widest">
                  <span>Slight</span>
                  <span>Maximum</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Max Resolution</span>
                  <span className="text-white font-bold">{maxWidth}px</span>
                </div>
                <select 
                  value={maxWidth}
                  onChange={(e) => setMaxWidth(parseInt(e.target.value))}
                  className="w-full bg-zinc-800 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value={800}>Low Res (800px)</option>
                  <option value={1280}>HD (1280px)</option>
                  <option value={1920}>Full HD (1920px)</option>
                  <option value={3840}>4K (3840px)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 space-y-4">
              {results.length > 0 ? (
                <button
                  onClick={downloadAll}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  {results.length > 1 ? <Archive className="h-5 w-5" /> : <Download className="h-5 w-5" />}
                  <span>Download {results.length > 1 ? "ZIP Bundle" : "Image"}</span>
                </button>
              ) : (
                <button
                  disabled={files.length === 0 || isProcessing}
                  onClick={compressImages}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all",
                    files.length === 0 || isProcessing
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>{processingIndex + 1}/{files.length} processing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5" />
                      <span>Compress {files.length} Images</span>
                    </>
                  )}
                </button>
              )}

              <p className="text-[10px] text-zinc-500 text-center uppercase tracking-widest font-bold">
                Privacy Protected: Processing happens locally
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
