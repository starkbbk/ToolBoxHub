"use client";

import { useState } from "react";
import * as pdfjs from "pdfjs-dist/build/pdf";
import * as XLSX from "xlsx/xlsx.mjs";
import { 
  Table, 
  Download, 
  Loader2, 
  X,
  ArrowRight,
  FileSpreadsheet
} from "lucide-react";
import { toast } from "sonner";
import PDFDropzone from "./PDFDropzone";
import { cn } from "@/lib/utils";

// Initialize PDF.js worker
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

export default function PDFToExcel() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const convertToExcel = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(5);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const allRows: any[][] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // 1. Cluster items into unique Y (rows) and X (columns)
        const rowTolerance = 8;
        const colTolerance = 15;
        
        const rawItems = textContent.items.map((item: any) => ({
          str: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width
        }));

        // Get unique Y coordinates (descending)
        const yCoords: number[] = [];
        rawItems.forEach((item: any) => {
          if (!yCoords.some((y: number) => Math.abs(y - item.y) < rowTolerance)) {
            yCoords.push(item.y);
          }
        });
        yCoords.sort((a, b) => b - a);

        // Get unique X coordinates (columns)
        const xCoords: number[] = [];
        rawItems.forEach((item: any) => {
          if (!xCoords.some((x: number) => Math.abs(x - item.x) < colTolerance)) {
            xCoords.push(item.x);
          }
        });
        xCoords.sort((a, b) => a - b);

        // 2. Map items to grid cells
        const pageGrid: string[][] = Array.from({ length: yCoords.length }, () => 
          Array(xCoords.length).fill("")
        );

        rawItems.forEach((item: any) => {
          const rowIndex = yCoords.findIndex((y: number) => Math.abs(y - item.y) < rowTolerance);
          const colIndex = xCoords.findIndex((x: number) => Math.abs(x - item.x) < colTolerance);
          if (rowIndex !== -1 && colIndex !== -1) {
            // Append if cell already has text (handle multi-word cells)
            pageGrid[rowIndex][colIndex] = (pageGrid[rowIndex][colIndex] + " " + item.str).trim();
          }
        });

        allRows.push(...pageGrid);
        setProgress(Math.round((i / numPages) * 90) + 5);
      }

      // 3. Create Workbook
      const worksheet = XLSX.utils.aoa_to_sheet(allRows);
      
      // Basic auto-width detection
      const wscols = [];
      if (allRows.length > 0) {
        for (let i = 0; i < allRows[0].length; i++) {
           wscols.push({ wch: 20 });
        }
        worksheet["!cols"] = wscols;
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet 1");
      
      // Export
      XLSX.writeFile(workbook, `${file.name.replace(".pdf", "")}.xlsx`);
      
      setProgress(100);
      toast.success("Structural Excel export complete!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to map PDF table to Excel");
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
          label="Select a PDF with tables to convert to Excel" 
        />
      ) : (
        <div className="space-y-8">
          {/* File Card */}
          <div className="flex items-center gap-4 p-6 rounded-3xl border border-white/5 bg-zinc-950/50 backdrop-blur-xl">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Table className="h-6 w-6" />
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
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500/10 border-t-emerald-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-emerald-400 font-bold">
                    {progress}%
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-white font-medium">Detecting table grid...</p>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300"
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
                        <ArrowRight className="h-8 w-8 rotate-90" />
                     </div>
                     <span className="text-xs font-bold text-zinc-500 uppercase">PDF</span>
                  </div>
                  <ArrowRight className="h-6 w-6 text-zinc-700" />
                  <div className="flex flex-col items-center gap-2">
                     <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                        <Table className="h-8 w-8" />
                     </div>
                     <span className="text-xs font-bold text-zinc-500 uppercase">XLSX</span>
                  </div>
                </div>
                
                <button
                  onClick={convertToExcel}
                  className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  <FileSpreadsheet className="h-5 w-5" />
                  Convert to Excel (.xlsx)
                </button>
              </div>
            )}
          </div>
          
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
             <p className="text-xs text-emerald-300 leading-relaxed italic">
               Note: This tool reconstructs the spreadsheet based on text item alignment. Complex nested tables may vary.
             </p>
          </div>
        </div>
      )}
    </div>
  );
}
