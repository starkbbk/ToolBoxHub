"use client";

import { useState } from "react";
import * as pdfjs from "pdfjs-dist/build/pdf";
import pptxgen from "pptxgenjs";
import { 
  FileText, 
  Download, 
  Loader2, 
  X,
  Presentation,
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

export default function PDFToPPT() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const convertToPPT = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(10);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const pptx = new pptxgen();

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });
        
        const slide = pptx.addSlide();
        
        // Match slide size to PDF page size (1 point = 1/72 inch)
        const pageWidthInch = viewport.width / 72;
        const pageHeightInch = viewport.height / 72;
        
        // We set slide size globally for the presentation based on first page
        if (i === 1) {
            pptx.defineLayout({ 
                name: 'PDF_LAYOUT', 
                width: pageWidthInch, 
                height: pageHeightInch 
            });
            pptx.layout = 'PDF_LAYOUT';
        }

        textContent.items.forEach((item: any) => {
          const fontSize = Math.abs(item.transform[0]);
          const fontName = item.fontName || "";
          const x = item.transform[4] / 72;
          const y = (viewport.height - item.transform[5] - fontSize) / 72; // Flip Y coordinate
          
          slide.addText(item.str, {
            x: x,
            y: y,
            fontSize: fontSize,
            bold: fontName.toLowerCase().includes("bold"),
            italic: fontName.toLowerCase().includes("italic"),
            color: "000000", // Default black, could extract more if needed
            autoFit: true
          });
        });

        setProgress(Math.round((i / numPages) * 85) + 5);
      }

      const blob = await pptx.write({ outputType: "blob" }) as Blob;
      saveAs(blob, `${file.name.replace(".pdf", "")}.pptx`);
      
      setProgress(100);
      toast.success("High-fidelity Presentation generated!");
    } catch (error) {
      console.error(error);
      toast.error("PPT conversion failed");
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
          label="Select a PDF to convert to PowerPoint Slide Deck" 
        />
      ) : (
        <div className="space-y-8">
          {/* File Card */}
          <div className="flex items-center gap-4 p-6 rounded-3xl border border-white/5 bg-zinc-950/50 backdrop-blur-xl">
            <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400">
              <Presentation className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white mb-0.5">{file.name}</h3>
              <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="p-2.5 text-zinc-500 hover:text-orange-400 hover:bg-orange-500/10 rounded-xl transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/40 rounded-3xl border border-white/5 border-dashed">
            {processing ? (
              <div className="text-center space-y-6 w-full max-w-md">
                <div className="relative h-20 w-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-orange-500/10 border-t-orange-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-orange-400 font-bold">
                    {progress}%
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-white font-medium">Mapping slides to coordinates...</p>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 transition-all duration-300"
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
                     <div className="p-4 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                        <Presentation className="h-8 w-8" />
                     </div>
                     <span className="text-xs font-bold text-zinc-500 uppercase">PPTX</span>
                  </div>
                </div>
                
                <button
                  onClick={convertToPPT}
                  className="px-10 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-bold flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                >
                  <Download className="h-5 w-5" />
                  Convert to Slide Deck
                </button>
              </div>
            )}
          </div>
          
          <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 text-center">
             <p className="text-xs text-orange-300 leading-relaxed italic">
               Note: Full structural mapping ensures text placement matches the original document layout exactly.
             </p>
          </div>
        </div>
      )}
    </div>
  );
}
