"use client";

import { useState, useMemo } from "react";
import { PDF_TOOLS, PDFTool } from "@/constants/pdf-tools";
import ToolSidebar from "@/components/pdf-converter/ToolSidebar";
import ToolDashboard from "@/components/pdf-converter/ToolDashboard";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Home } from "lucide-react";

// Tool Components (implemented or coming soon)
import PDFMerge from "@/components/pdf-converter/PDFMerge";
import PDFToImage from "@/components/pdf-converter/PDFToImage";
import ImageToPDF from "@/components/pdf-converter/ImageToPDF";
import PDFSplit from "@/components/pdf-converter/PDFSplit";
import PDFRotate from "@/components/pdf-converter/PDFRotate";
import PDFPageNumbers from "@/components/pdf-converter/PDFPageNumbers";
import PDFOrganize from "@/components/pdf-converter/PDFOrganize";
import WordToPDF from "@/components/pdf-converter/WordToPDF";
import PDFToWord from "@/components/pdf-converter/PDFToWord";
import PDFToPPT from "@/components/pdf-converter/PDFToPPT";
import PDFToExcel from "@/components/pdf-converter/PDFToExcel";
import ExcelToPDF from "@/components/pdf-converter/ExcelToPDF";
import HTMLToPDF from "@/components/pdf-converter/HTMLToPDF";
import PDFSign from "@/components/pdf-converter/PDFSign";
import PDFWatermark from "@/components/pdf-converter/PDFWatermark";
import PDFOCR from "@/components/pdf-converter/PDFOCR";
import PDFSummarize from "@/components/pdf-converter/PDFSummarize";
import PDFTranslate from "@/components/pdf-converter/PDFTranslate";
import PDFCompress from "@/components/pdf-converter/PDFCompress";
import PDFProtect from "@/components/pdf-converter/PDFProtect";
import PDFUnlock from "@/components/pdf-converter/PDFUnlock";
import PDFDeletePages from "@/components/pdf-converter/PDFDeletePages";
import PDFExtractPages from "@/components/pdf-converter/PDFExtractPages";
import PDFRepair from "@/components/pdf-converter/PDFRepair";
import PDFOptimize from "@/components/pdf-converter/PDFOptimize";
import PDFGrayscale from "@/components/pdf-converter/PDFGrayscale";
import PDFCrop from "@/components/pdf-converter/PDFCrop";
import PDFResize from "@/components/pdf-converter/PDFResize";
import PDFRedact from "@/components/pdf-converter/PDFRedact";
import PDFToPDFA from "@/components/pdf-converter/PDFToPDFA";
import PDFCompare from "@/components/pdf-converter/PDFCompare";
import PDFScan from "@/components/pdf-converter/PDFScan";

export default function PDFConverterPage() {
  const [activeToolId, setActiveToolId] = useState<string | null>(null);

  const activeTool = useMemo(() => 
    PDF_TOOLS.find(t => t.id === activeToolId) || null
  , [activeToolId]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderTool = () => {
    if (!activeToolId) return <ToolDashboard onSelectTool={(id) => { setActiveToolId(id); setIsSidebarOpen(false); }} />;

    switch (activeToolId) {
      case "merge": return <PDFMerge />;
      case "split": return <PDFSplit />;
      case "rotate": return <PDFRotate />;
      case "page-numbers": return <PDFPageNumbers />;
      case "organize": return <PDFOrganize />;
      case "pdf-to-image": return <PDFToImage />;
      case "image-to-pdf": return <ImageToPDF />;
      case "word-to-pdf": return <WordToPDF />;
      case "pdf-to-word": return <PDFToWord />;
      case "pdf-to-ppt": return <PDFToPPT />;
      case "pdf-to-excel": return <PDFToExcel />;
      case "excel-to-pdf": return <ExcelToPDF />;
      case "html-to-pdf": return <HTMLToPDF />;
      case "sign": return <PDFSign />;
      case "watermark": return <PDFWatermark />;
      case "ocr": return <PDFOCR />;
      case "summarize": return <PDFSummarize />;
      case "translate": return <PDFTranslate />;
      case "compress-pdf": return <PDFCompress />;
      case "protect-pdf": return <PDFProtect />;
      case "unlock-pdf": return <PDFUnlock />;
      case "delete-pages": return <PDFDeletePages />;
      case "extract-pages": return <PDFExtractPages />;
      case "repair-pdf": return <PDFRepair />;
      case "optimize-pdf": return <PDFOptimize />;
      case "grayscale-pdf": return <PDFGrayscale />;
      case "crop-pdf": return <PDFCrop />;
      case "resize-pdf": return <PDFResize />;
      case "redact-pdf": return <PDFRedact />;
      case "pdf-to-pdfa": return <PDFToPDFA />;
      case "compare": return <PDFCompare />;
      case "scan": return <PDFScan />;
      default:
        return activeTool ? (
          <div className="flex flex-col items-center justify-center p-10 md:p-20 text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="p-8 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <activeTool.icon className="h-12 w-12 md:h-16 md:w-16" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-white">{activeTool.label}</h2>
              <p className="text-zinc-500 max-w-md mx-auto text-sm">
                This tool is currently being optimized for high-performance browser execution. 
                Full activation coming soon!
              </p>
            </div>
            <button 
              onClick={() => setActiveToolId(null)}
              className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-bold transition-all text-sm"
            >
              Back to Dashboard
            </button>
          </div>
        ) : null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background overflow-hidden relative">
      {/* Dynamic Sidebar - Responsive */}
      <div className={cn(
        "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300",
        isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )} onClick={() => setIsSidebarOpen(false)} />
      
      <div className={cn(
        "absolute lg:relative z-50 h-full transition-transform duration-300 transform lg:translate-x-0 w-72 shrink-0 border-r border-border",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <ToolSidebar 
          activeToolId={activeToolId} 
          onSelectTool={(id) => { setActiveToolId(id); setIsSidebarOpen(false); }} 
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background/50 relative">
        {/* Context Header */}
        {activeTool && (
          <div className="h-16 px-4 md:px-8 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center gap-2 md:gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all"
              >
                <ChevronLeft className={cn("h-5 w-5 transition-transform", isSidebarOpen ? "rotate-180" : "")} />
              </button>
              <button 
                onClick={() => setActiveToolId(null)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all"
                title="Back to Dashboard"
              >
                <Home className="h-5 w-5" />
              </button>
              <div className="h-4 w-px bg-border hidden md:block" />
              <div className="flex items-center gap-3 overflow-hidden">
                {activeTool.icon && <activeTool.icon className="h-5 w-5 text-primary shrink-0" />}
                <h2 className="font-bold text-foreground truncate text-sm md:text-base">{activeTool.label}</h2>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-primary text-[10px] font-black uppercase tracking-widest"
              >
                Tools
              </button>
              {activeTool.isBackend && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">AI Enhanced</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Tool Content */}
        <div className={cn("flex-1 overflow-auto", !activeToolId && "bg-transparent")}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeToolId || "dashboard"}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-full"
            >
              {renderTool()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Utility to merge cn
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
