"use client";

import { useState, useEffect } from "react";
import { 
  Scissors, 
  Download, 
  Loader2, 
  X,
  FileText,
  Hash,
  ArrowRight
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import PDFDropzone from "./PDFDropzone";
import { cn } from "@/lib/utils";

export default function PDFSplit() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [range, setRange] = useState<string>("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (file) {
      const getInfo = async () => {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer);
          setPageCount(pdfDoc.getPageCount());
        } catch (error) {
          toast.error("Error reading PDF structure");
        }
      };
      getInfo();
    }
  }, [file]);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setRange("");
    }
  };

  const parseRange = (input: string, max: number): number[] => {
    const pages = new Set<number>();
    const parts = input.split(",").map(p => p.trim());

    parts.forEach(part => {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.max(1, start); i <= Math.min(max, end); i++) {
            pages.add(i - 1); // 0-indexed for pdf-lib
          }
        }
      } else {
        const page = Number(part);
        if (!isNaN(page) && page >= 1 && page <= max) {
          pages.add(page - 1);
        }
      }
    });

    return Array.from(pages).sort((a, b) => a - b);
  };

  const handleSplit = async () => {
    if (!file || !range) return;

    const selectedIndices = parseRange(range, pageCount);
    if (selectedIndices.length === 0) {
      toast.error("Invalid page range selection");
      return;
    }

    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();
      
      const copiedPages = await newPdf.copyPages(pdfDoc, selectedIndices);
      copiedPages.forEach(page => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      saveAs(blob, `split_${file.name}`);
      toast.success(`Extracted ${selectedIndices.length} pages successfully!`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to split PDF");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!file ? (
        <PDFDropzone 
          onFilesSelected={handleFileSelected} 
          multiple={false} 
          label="Select a PDF to extract pages" 
        />
      ) : (
        <div className="max-w-2xl mx-auto space-y-8">
          {/* File Card */}
          <div className="flex items-center gap-4 rounded-3xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-sm">
            <div className="rounded-2xl bg-sky-500/10 p-4 text-sky-400">
              <Scissors className="h-8 w-8" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate text-lg">{file.name}</p>
              <p className="text-zinc-500">{pageCount > 0 ? `${pageCount} Pages` : "Reading..."}</p>
            </div>
            {!processing && (
              <button 
                onClick={() => { setFile(null); setRange(""); }}
                className="p-3 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-8 backdrop-blur-xl space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 ml-1 flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Page Selection
              </label>
              <input 
                type="text"
                placeholder="e.g. 1-5, 8, 10-12"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
              />
              <p className="text-xs text-zinc-500 ml-1 mt-2">
                Use commas for separate pages and dashes for ranges. Total pages available: <span className="text-white">{pageCount}</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/10">
              <div className="flex gap-3">
                <FileText className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-sky-200 font-medium">Extracting Pages</p>
                  <p className="text-sky-200/60 leading-relaxed">
                    Selected pages will be bundled into a new PDF file. Original file remains untouched.
                  </p>
                </div>
              </div>
            </div>

            <button
              disabled={!range || processing}
              onClick={handleSplit}
              className={cn(
                "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all",
                !range || processing
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-sky-600 hover:bg-sky-500 text-white shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Splitting...</span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  <span>Extract Pages</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
