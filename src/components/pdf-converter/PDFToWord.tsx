"use client";

import { useState } from "react";
import * as pdfjs from "pdfjs-dist/build/pdf";
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
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
        const viewport = page.getViewport({ scale: 1.0 });
        
        // Group text items by their Y coordinate (Line grouping)
        // We use a small tolerance for Y coordinates (e.g. 5 points)
        const TOLERANCE = 5;
        const lineGroups: { y: number; items: any[] }[] = [];

        textContent.items.forEach((item: any) => {
          const y = item.transform[5];
          const x = item.transform[4];
          const fontSize = Math.abs(item.transform[0]);
          const fontName = item.fontName || "";
          
          let foundGroup = lineGroups.find(g => Math.abs(g.y - y) < TOLERANCE);
          if (!foundGroup) {
            foundGroup = { y, items: [] };
            lineGroups.push(foundGroup);
          }
          foundGroup.items.push({ 
            str: item.str, 
            x, 
            fontSize, 
            bold: fontName.toLowerCase().includes("bold") || fontName.toLowerCase().includes("black"),
            italic: fontName.toLowerCase().includes("italic") || fontName.toLowerCase().includes("oblique")
          });
        });

        // Sort lines from top to bottom
        lineGroups.sort((a, b) => b.y - a.y);

        lineGroups.forEach((group: any) => {
          // Sort items in line from left to right
          group.items.sort((a: any, b: any) => a.x - b.x);
          
          const runs: TextRun[] = [];
          let currentX = 0;

          group.items.forEach((item: any, idx: number) => {
            // Add spacing between runs to maintain horizontal layout
            // Docx doesn't support absolute X placement easily in a standard paragraph, 
            // so we use non-breaking spaces to simulate the gap.
            const gap = idx === 0 ? item.x : item.x - currentX;
            const spaces = " ".repeat(Math.max(0, Math.floor(gap / 4))); // Rough conversion points -> spaces

            runs.push(new TextRun({
              text: spaces + item.str,
              bold: item.bold,
              italics: item.italic,
              size: item.fontSize * 2, // docx uses half-points
            }));
            
            // Approximate width of the text to update currentX
            currentX = item.x + (item.str.length * (item.fontSize * 0.5));
          });

          if (runs.length > 0) {
            paragraphs.push(new Paragraph({
              children: runs,
              spacing: { before: 100, after: 100 }
            }));
          }
        });

        // Add page break
        if (i < numPages) {
          paragraphs.push(new Paragraph({ children: [new TextRun({ text: "", break: 1 })] }));
        }

        setProgress(Math.round((i / numPages) * 85) + 5);
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
      toast.success("High-fidelity Word conversion complete!");
    } catch (error) {
      console.error(error);
      toast.error("Enhanced conversion failed");
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
          label="Select a PDF document for High-Fidelity Word Conversion" 
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
                  <p className="text-white font-medium">Reconstructing layout...</p>
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
                  Convert to Word (.docx)
                </button>
              </div>
            )}
          </div>
          
          <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 text-center">
             <p className="text-xs text-orange-300 leading-relaxed italic">
               Note: This engine performs positional reconstruction to mirror the original PDF's layout as closely as possible.
             </p>
          </div>
        </div>
      )}
    </div>
  );
}
