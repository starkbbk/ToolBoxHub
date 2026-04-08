"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  Table, 
  Download, 
  Loader2, 
  X,
  ArrowRight,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import PDFDropzone from "./PDFDropzone";
import { cn } from "@/lib/utils";

export default function ExcelToPDF() {
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
      
      // Step 1: Read Excel
      setProgress(30);
      const workbook = XLSX.read(arrayBuffer);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Step 2: Convert to Json Array of Arrays (suitable for autoTable)
      setProgress(50);
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      // Step 3: Generate PDF
      setProgress(70);
      const doc = new jsPDF();
      
      autoTable(doc, {
        head: [data[0]],
        body: data.slice(1),
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [79, 70, 229] }, // Indigo primary color
        margin: { top: 20 },
        didDrawPage: (data) => {
          doc.setFontSize(10);
          doc.text(`Sheet: ${firstSheetName}`, data.settings.margin.left, 10);
        }
      });
      
      setProgress(90);
      doc.save(`${file.name.replace(".xlsx", "").replace(".xls", "")}.pdf`);
      
      setProgress(100);
      toast.success("Excel spreadsheet converted to PDF successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to convert Excel to PDF");
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
          accept={{ "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"], "application/vnd.ms-excel": [".xls"] }}
          label="Select an Excel spreadsheet to convert to PDF" 
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

          {/* Action Area */}
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
                  <p className="text-white font-medium">Generating document table...</p>
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
                     <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Table className="h-8 w-8" />
                     </div>
                     <span className="text-xs font-bold text-zinc-500 uppercase">Excel</span>
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
                  className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  <Download className="h-5 w-5" />
                  Convert to PDF
                </button>
              </div>
            )}
          </div>
          
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
             <p className="text-xs text-emerald-300 leading-relaxed italic">
               Note: This tool converts the first sheet of your workbook into a clean, searchable PDF table.
             </p>
          </div>
        </div>
      )}
    </div>
  );
}
