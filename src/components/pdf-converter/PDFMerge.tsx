"use client";

import { useState } from "react";
import { Reorder, motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  GripVertical, 
  X, 
  Combine, 
  Download,
  Loader2,
  Plus
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import PDFDropzone from "./PDFDropzone";
import { cn } from "@/lib/utils";

export default function PDFMerge() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast.error("Please select at least 2 PDF files to merge.");
      return;
    }

    setProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();
      
      for (const file of files) {
        const fileArrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(fileArrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes as any], { type: "application/pdf" });
      saveAs(blob, "merged_document.pdf");
      toast.success("PDFs merged successfully!");
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while merging the PDFs.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!files.length ? (
        <PDFDropzone onFilesSelected={handleFilesSelected} label="Select multiple PDFs to merge" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-400" />
                Selected Files ({files.length})
              </h3>
              <button 
                onClick={() => setFiles([])}
                className="text-sm text-zinc-500 hover:text-rose-400 transition-colors"
              >
                Clear all
              </button>
            </div>

            <Reorder.Group 
              axis="y" 
              values={files} 
              onReorder={setFiles}
              className="space-y-3"
            >
              <AnimatePresence mode="popLayout">
                {files.map((file, index) => (
                  <Reorder.Item
                    key={`${file.name}-${index}`}
                    value={file}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="group"
                  >
                    <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-zinc-900/40 p-4 hover:bg-zinc-900/60 transition-colors backdrop-blur-sm">
                      <div className="cursor-grab active:cursor-grabbing p-1 text-zinc-600 hover:text-zinc-400 transition-colors">
                        <GripVertical className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0 flex items-center gap-3">
                        <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="truncate">
                          <p className="font-medium text-white truncate">{file.name}</p>
                          <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => removeFile(index)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>

            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = '.pdf';
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.files) {
                    handleFilesSelected(Array.from(target.files));
                  }
                };
                input.click();
              }}
              className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center gap-2 text-zinc-500 hover:text-white hover:border-white/10 hover:bg-white/5 transition-all group"
            >
              <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span>Add more files</span>
            </button>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-3xl border border-white/10 bg-zinc-900/80 p-6 backdrop-blur-xl shadow-2xl">
              <h4 className="text-lg font-bold text-white mb-4">Merge Summary</h4>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Total Files:</span>
                  <span className="text-white font-medium">{files.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Estimated Size:</span>
                  <span className="text-white font-medium">
                    {(files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>

              <button
                disabled={files.length < 2 || processing}
                onClick={handleMerge}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all",
                  files.length < 2 || processing
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Merging...</span>
                  </>
                ) : (
                  <>
                    <Combine className="h-5 w-5" />
                    <span>Merge {files.length} PDFs</span>
                  </>
                )}
              </button>

              <div className="mt-4 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                <p className="text-xs text-indigo-300 text-center leading-relaxed">
                  Files are processed securely in your browser and never uploaded to any server.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
