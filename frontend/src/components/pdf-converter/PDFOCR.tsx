"use client";

import { useState } from "react";
import * as pdfjs from "pdfjs-dist";
import { createWorker } from "tesseract.js";
import { 
  Scan, 
  Download, 
  Loader2, 
  X,
  Copy,
  FileText,
  Languages
} from "lucide-react";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import PDFDropzone from "./PDFDropzone";
import { cn } from "@/lib/utils";

// Initialize PDF.js worker
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

export default function PDFOCR() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const runOCR = async () => {
    if (!file) return;

    setProcessing(true);
    setExtractedText("");
    setProgress(5);
    setStatus("Initializing OCR engine...");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      let fullText = "";

      const worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
             // Progress within a page
          }
        }
      });

      for (let i = 1; i <= numPages; i++) {
        setStatus(`Processing Page ${i} of ${numPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: ctx, viewport }).promise;
        const imageData = canvas.toDataURL("image/png");

        const { data: { text } } = await worker.recognize(imageData);
        fullText += `--- Page ${i} ---\n${text}\n\n`;
        
        setProgress(Math.round((i / numPages) * 90) + 5);
      }

      await worker.terminate();
      setExtractedText(fullText);
      setProgress(100);
      setStatus("OCR Complete!");
      toast.success("Text extracted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("OCR failed. Please try a different document.");
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(extractedText);
    toast.success("Copied to clipboard!");
  };

  const downloadText = () => {
    const blob = new Blob([extractedText], { type: "text/plain" });
    saveAs(blob, `${file?.name.replace(".pdf", "")}_extracted.txt`);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!file ? (
        <PDFDropzone onFilesSelected={handleFileSelected} multiple={false} label="Select a scanned PDF or image for OCR" />
      ) : (
        <div className="space-y-8">
           {/* File Info */}
           <div className="flex items-center gap-4 p-6 rounded-3xl border border-white/5 bg-zinc-950/50 backdrop-blur-xl">
             <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
               <Scan className="h-6 w-6" />
             </div>
             <div className="flex-1">
               <h3 className="font-bold text-white mb-0.5">{file.name}</h3>
               <p className="text-xs text-zinc-500">Ready for Optical Character Recognition</p>
             </div>
             <button onClick={() => setFile(null)} className="p-2.5 text-zinc-500 hover:text-white transition-all">
                <X className="h-5 w-5" />
             </button>
           </div>

           {!extractedText && !processing && (
             <div className="flex flex-col items-center justify-center p-20 bg-zinc-900/40 rounded-3xl border border-white/5 border-dashed gap-6">
                <div className="p-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                   <FileText className="h-10 w-10" />
                </div>
                <div className="text-center space-y-2">
                   <h4 className="text-lg font-bold text-white">Extract Text from Document</h4>
                   <p className="text-sm text-zinc-500 max-w-sm">This tool uses AI to read the text inside scanned images or non-searchable PDF files.</p>
                </div>
                <button
                  onClick={runOCR}
                  className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold flex items-center gap-3 transition-all hover:scale-105 shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                >
                  <Scan className="h-5 w-5" />
                  Start OCR Process
                </button>
             </div>
           )}

           {processing && (
             <div className="flex flex-col items-center justify-center p-20 bg-zinc-900/40 rounded-3xl border border-white/5 gap-8">
                <div className="relative h-24 w-24">
                   <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin" />
                   <div className="absolute inset-0 flex items-center justify-center text-indigo-400 font-bold">
                      {progress}%
                   </div>
                </div>
                <div className="text-center space-y-3">
                   <p className="text-white font-medium">{status}</p>
                   <div className="w-64 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                   </div>
                </div>
             </div>
           )}

           {extractedText && (
             <div className="space-y-4 scale-in duration-500">
                <div className="flex items-center justify-between">
                   <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      Extracted Text
                   </label>
                   <div className="flex gap-2">
                      <button 
                        onClick={copyToClipboard}
                        className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all flex items-center gap-2"
                      >
                        <Copy className="h-3 w-3" /> Copy
                      </button>
                      <button 
                        onClick={downloadText}
                        className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all flex items-center gap-2"
                      >
                        <Download className="h-3 w-3" /> Download .txt
                      </button>
                   </div>
                </div>
                <textarea
                  readOnly
                  value={extractedText}
                  className="w-full h-96 bg-zinc-950 border border-white/10 rounded-3xl p-8 text-sm font-mono text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 custom-scrollbar resize-none"
                />
             </div>
           )}
        </div>
      )}
    </div>
  );
}
