"use client";

import { useState } from "react";
import * as pdfjs from "pdfjs-dist/build/pdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { 
  FileText, 
  Download, 
  Loader2, 
  X,
  ArrowRight
} from "lucide-react";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import PDFDropzone from "./PDFDropzone";
import { cn } from "@/lib/utils";

// Initialize PDF.js worker
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

export default function PDFToWord() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const convertToWord = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(10);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const paragraphs: Paragraph[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Group text items by their Y coordinate to form lines
        const lines: { [key: number]: string[] } = {};
        textContent.items.forEach((item: any) => {
          const y = Math.round(item.transform[5]);
          if (!lines[y]) lines[y] = [];
          lines[y].push(item.str);
        });

        // Sort lines from top to bottom
        const sortedY = Object.keys(lines).map(Number).sort((a, b) => b - a);
        
        sortedY.forEach(y => {
          const lineText = lines[y].join(" ");
          if (lineText.trim()) {
            paragraphs.push(new Paragraph({
              children: [new TextRun(lineText)],
              spacing: { after: 200 }
            }));
          }
        });

        // Add page break after each page except the last
        if (i < numPages) {
          // Note: docx uses page breaks differently, but we'll add a spacer for now
          paragraphs.push(new Paragraph({ children: [new TextRun("")] }));
        }

        setProgress(Math.round((i / numPages) * 80) + 10);
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs,
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${file.name.replace(".pdf", "")}.docx`);
      
      setProgress(100);
      toast.success("PDF converted to Word successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to convert PDF to Word");
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
          label="Select a PDF document to convert to Word" 
        />
      ) : (
        <div className="space-y-8">
          {/* File Card */}
          <div className="flex items-center gap-4 p-6 rounded-3xl border border-white/5 bg-zinc-950/50 backdrop-blur-xl">
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400">
              <FileText className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white mb-0.5">{file.name}</h3>
              <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="p-2.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Action Area */}
          <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/40 rounded-3xl border border-white/5 border-dashed">
            {processing ? (
              <div className="text-center space-y-6 w-full max-w-md">
                <div className="relative h-20 w-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-rose-500/10 border-t-rose-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-rose-400 font-bold">
                    {progress}%
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-white font-medium">Extracting text & formatting...</p>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-8">
                  <div className="flex flex-col items-center gap-2">
                     <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                        <FileText className="h-8 w-8" />
                     </div>
                     <span className="text-xs font-bold text-zinc-500 uppercase">PDF</span>
                  </div>
                  <ArrowRight className="h-6 w-6 text-zinc-700" />
                  <div className="flex flex-col items-center gap-2">
                     <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <FileText className="h-8 w-8" />
                     </div>
                     <span className="text-xs font-bold text-zinc-500 uppercase">Word</span>
                  </div>
                </div>
                
                <button
                  onClick={convertToWord}
                  className="px-10 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                >
                  <Download className="h-5 w-5" />
                  Convert to Word
                </button>
              </div>
            )}
          </div>
          
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 text-center">
             <p className="text-xs text-rose-300 leading-relaxed italic">
               Note: This tool extracts selectable text. Scanned PDFs without a text layer need the "OCR PDF" tool instead.
             </p>
          </div>
        </div>
      )}
    </div>
  );
}
