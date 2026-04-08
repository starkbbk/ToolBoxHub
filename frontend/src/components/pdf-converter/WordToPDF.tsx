"use client";

import { useState } from "react";
import mammoth from "mammoth";
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

// Note: html2pdf.js often needs to be loaded dynamically or handled as a script tag
// because it has some non-ESM dependencies.
let html2pdf: any;
if (typeof window !== "undefined") {
  import("html2pdf.js").then((module) => {
    html2pdf = module.default;
  });
}

export default function WordToPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const convertToPDF = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(10);

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Step 1: Convert Word to HTML
      setProgress(30);
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;
      
      setProgress(60);
      
      // Step 2: Convert HTML to PDF
      const element = document.createElement("div");
      element.innerHTML = `
        <div style="padding: 40px; font-family: sans-serif; line-height: 1.6;">
          ${html}
        </div>
      `;
      
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${file.name.replace(".docx", "").replace(".doc", "")}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      setProgress(80);
      await html2pdf().from(element).set(opt).save();
      
      setProgress(100);
      toast.success("Word document converted to PDF successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to convert Word to PDF");
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
          accept={{ "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"], "application/msword": [".doc"] }}
          label="Select a Word document to convert to PDF" 
        />
      ) : (
        <div className="space-y-8">
          {/* File Card */}
          <div className="flex items-center gap-4 p-6 rounded-3xl border border-white/5 bg-zinc-950/50 backdrop-blur-xl">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
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
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500/10 border-t-blue-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-blue-400 font-bold">
                    {progress}%
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-white font-medium">Converting Word to PDF...</p>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-8">
                  <div className="flex flex-col items-center gap-2">
                     <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <FileText className="h-8 w-8" />
                     </div>
                     <span className="text-xs font-bold text-zinc-500 uppercase">Word</span>
                  </div>
                  <ArrowRight className="h-6 w-6 text-zinc-700" />
                  <div className="flex flex-col items-center gap-2">
                     <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                        <FileText className="h-8 w-8" />
                     </div>
                     <span className="text-xs font-bold text-zinc-500 uppercase">PDF</span>
                  </div>
                </div>
                
                <button
                  onClick={convertToPDF}
                  className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                >
                  <Download className="h-5 w-5" />
                  Convert to PDF
                </button>
              </div>
            )}
          </div>
          
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center">
             <p className="text-xs text-blue-300 leading-relaxed italic">
               Note: Mammoth focuses on structural conversion (headings, lists, tables). Simple layouts work best.
             </p>
          </div>
        </div>
      )}
    </div>
  );
}
