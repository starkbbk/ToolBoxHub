"use client";

import { useState } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { 
  Hash, 
  Download, 
  Loader2, 
  X,
  FileText,
  Type,
  Layout
} from "lucide-react";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import PDFDropzone from "./PDFDropzone";
import { cn } from "@/lib/utils";

type Position = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

export default function PDFPageNumbers() {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<Position>("bottom-center");
  const [fontSize, setFontSize] = useState(12);
  const [startNumber, setStartNumber] = useState(1);
  const [processing, setProcessing] = useState(false);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleAddNumbers = async () => {
    if (!file) return;

    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const text = `${i + startNumber}`;
        const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);
        const margin = 30;

        let x = 0;
        let y = 0;

        // X Positioning
        if (position.includes("left")) x = margin;
        else if (position.includes("center")) x = (width - textWidth) / 2;
        else if (position.includes("right")) x = width - textWidth - margin;

        // Y Positioning
        if (position.includes("top")) y = height - margin - fontSize;
        else if (position.includes("bottom")) y = margin;

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font: helveticaFont,
          color: rgb(0.3, 0.3, 0.3), // Dark gray
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      saveAs(blob, `numbered_${file.name}`);
      toast.success("Page numbers added successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add page numbers");
    } finally {
      setProcessing(false);
    }
  };

  const positions: { id: Position; label: string }[] = [
    { id: "top-left", label: "Top Left" },
    { id: "top-center", label: "Top Center" },
    { id: "top-right", label: "Top Right" },
    { id: "bottom-left", label: "Bottom Left" },
    { id: "bottom-center", label: "Bottom Center" },
    { id: "bottom-right", label: "Bottom Right" },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!file ? (
        <PDFDropzone 
          onFilesSelected={handleFileSelected} 
          multiple={false} 
          label="Select a PDF to add page numbers" 
        />
      ) : (
        <div className="space-y-8">
          {/* File Card */}
          <div className="flex items-center gap-4 p-6 rounded-3xl border border-white/5 bg-zinc-950/50 backdrop-blur-xl">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Options Panel */}
            <div className="space-y-8 p-8 rounded-3xl border border-white/5 bg-zinc-900/40">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-wider">
                  <Layout className="h-4 w-4" />
                  Position
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {positions.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPosition(p.id)}
                      className={cn(
                        "px-4 py-3 rounded-xl text-xs font-bold transition-all border",
                        position === p.id 
                          ? "bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/10"
                          : "bg-zinc-800/50 border-white/5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-wider">
                    <Type className="h-4 w-4" />
                    Font Size
                  </label>
                  <input 
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-wider">
                    <Hash className="h-4 w-4" />
                    Starts From
                  </label>
                  <input 
                    type="number"
                    value={startNumber}
                    onChange={(e) => setStartNumber(Number(e.target.value))}
                    className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <button
                onClick={handleAddNumbers}
                disabled={processing}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:scale-[1.02] active:scale-[0.98]"
              >
                {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Hash className="h-5 w-5" />}
                Add Page Numbers
              </button>
            </div>

            {/* Preview Mockup */}
            <div className="flex flex-col items-center justify-center p-12 bg-zinc-950/50 rounded-3xl border border-dashed border-white/10">
              <div className="relative w-48 aspect-[3/4] bg-white rounded-lg shadow-2xl flex items-center justify-center overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-zinc-100" />
                <div className="space-y-2 w-full px-6">
                  <div className="h-2 w-3/4 bg-zinc-100 rounded" />
                  <div className="h-2 w-full bg-zinc-100 rounded" />
                  <div className="h-2 w-5/6 bg-zinc-100 rounded" />
                </div>
                
                {/* Dynamic Preview Number */}
                <div className={cn(
                  "absolute text-[10px] font-bold text-zinc-400",
                  position === "top-left" && "top-3 left-3",
                  position === "top-center" && "top-3 left-1/2 -translate-x-1/2",
                  position === "top-right" && "top-3 right-3",
                  position === "bottom-left" && "bottom-3 left-3",
                  position === "bottom-center" && "bottom-3 left-1/2 -translate-x-1/2",
                  position === "bottom-right" && "bottom-3 right-3",
                )}>
                  {startNumber}
                </div>
              </div>
              <p className="mt-6 text-xs text-zinc-500 font-medium uppercase tracking-widest italic">Live Preview Placement</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
