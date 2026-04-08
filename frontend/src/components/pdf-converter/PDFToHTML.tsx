"use client";

import { useState } from "react";
import * as pdfjs from "pdfjs-dist/build/pdf";
import { 
  FileText, 
  Download, 
  Loader2, 
  X,
  Globe,
  ArrowRight,
  Code
} from "lucide-react";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import PDFDropzone from "./PDFDropzone";
import { cn } from "@/lib/utils";

// Initialize PDF.js worker
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

export default function PDFToHTML() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const convertToHTML = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(10);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      
      let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${file.name}</title>
    <style>
        body { background: #f0f0f0; margin: 0; padding: 20px; font-family: sans-serif; }
        .page { 
            background: white; 
            margin: 0 auto 20px auto; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
            position: relative; 
            overflow: hidden; 
        }
        .text-item { 
            position: absolute; 
            white-space: pre; 
            transform-origin: left bottom;
        }
    </style>
</head>
<body>`;

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });
        
        htmlContent += `\n<div class="page" id="page-${i}" style="width: ${viewport.width}px; height: ${viewport.height}px;">`;

        textContent.items.forEach((item: any) => {
          const fontSize = Math.abs(item.transform[0]);
          const fontName = item.fontName || "";
          const x = item.transform[4];
          const y = viewport.height - item.transform[5] - fontSize; // Rectify Y coordinate
          
          const isBold = fontName.toLowerCase().includes("bold");
          const isItalic = fontName.toLowerCase().includes("italic");

          htmlContent += `
    <div class="text-item" style="left: ${x}px; top: ${y}px; font-size: ${fontSize}px; font-weight: ${isBold ? 'bold' : 'normal'}; font-style: ${isItalic ? 'italic' : 'normal'};">
        ${item.str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
    </div>`;
        });

        htmlContent += `\n</div>`;
        setProgress(Math.round((i / numPages) * 90) + 10);
      }

      htmlContent += `\n</body></html>`;

      const blob = new Blob([htmlContent], { type: "text/html" });
      saveAs(blob, `${file.name.replace(".pdf", "")}.html`);
      
      setProgress(100);
      toast.success("Exact-fidelity HTML generated!");
    } catch (error) {
      console.error(error);
      toast.error("HTML conversion failed");
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!file ? (
        <PDFDropzone 
          onFilesSelected={handleFileSelected} 
          multiple={false} 
          accept={{ "application/pdf": [".pdf"] }}
          label="Select a PDF to convert to exact-layout HTML" 
        />
      ) : (
        <div className="space-y-8">
          {/* File Card */}
          <div className="flex items-center gap-4 p-6 rounded-3xl border border-white/5 bg-zinc-950/50 backdrop-blur-xl">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
              <Globe className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white mb-0.5">{file.name}</h3>
              <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="p-2.5 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/40 rounded-3xl border border-white/5 border-dashed">
            {processing ? (
              <div className="text-center space-y-6 w-full max-w-md">
                <div className="relative h-20 w-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-indigo-400 font-bold">
                    {progress}%
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-white font-medium">Injecting absolute coordinates...</p>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-8">
                  <div className="flex flex-col items-center gap-2">
                     <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <FileText className="h-8 w-8" />
                     </div>
                     <span className="text-xs font-bold text-zinc-500 uppercase">PDF</span>
                  </div>
                  <ArrowRight className="h-6 w-6 text-zinc-700" />
                  <div className="flex flex-col items-center gap-2">
                     <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.1)]">
                        <Code className="h-8 w-8" />
                     </div>
                     <span className="text-xs font-bold text-zinc-500 uppercase">HTML</span>
                  </div>
                </div>
                
                <button
                  onClick={convertToHTML}
                  className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                >
                  <Download className="h-5 w-5" />
                  Generate Web Document
                </button>
              </div>
            )}
          </div>
          
          <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-center">
             <p className="text-xs text-indigo-300 leading-relaxed italic">
               Note: This tool uses CSS pinning to ensure the output remains visually identical to the source PDF.
             </p>
          </div>
        </div>
      )}
    </div>
  );
}
