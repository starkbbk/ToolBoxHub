"use client";

import { FileType, ImageIcon, Merge, Scissors, Play } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";

interface PDFControlsProps {
  jobId: number;
  onProcessStarted: () => void;
}

const OPTIONS = [
  { id: "to-text", name: "PDF to Text", icon: FileType, description: "Extract all text from the document" },
  { id: "to-images", name: "PDF to Images", icon: ImageIcon, description: "Convert pages to PNG images" },
  { id: "merge", name: "Merge PDFs", icon: Merge, description: "Combine with other documents" },
  { id: "split", name: "Split PDF", icon: Scissors, description: "Extract specific pages" },
];

export default function PDFControls({ jobId, onProcessStarted }: PDFControlsProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleProcess = async () => {
    if (!selectedType) return;
    
    setProcessing(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      if (selectedType === "to-text" || selectedType === "to-images") {
        await axios.post(`${apiBase}/api/pdf-converter/convert/${jobId}/${selectedType}`);
      } else if (selectedType === "merge") {
        await axios.post(`${apiBase}/api/pdf-converter/manipulate/merge`, [jobId]);
      }
      
      onProcessStarted();
      toast.success(`${selectedType} process started`);
    } catch (error) {
      toast.error("Failed to start process");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSelectedType(opt.id)}
            className={cn(
              "flex items-start gap-4 rounded-2xl border p-5 text-left transition-all duration-300",
              selectedType === opt.id 
                ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.1)]" 
                : "border-[#2a2a2a] bg-zinc-900/30 hover:bg-zinc-800/50 hover:border-[#3a3a3a]"
            )}
          >
            <div className={cn(
              "rounded-xl p-3",
              selectedType === opt.id ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-400"
            )}>
              <opt.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-white mb-1">{opt.name}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{opt.description}</p>
            </div>
          </button>
        ))}
      </div>

      <button 
        disabled={!selectedType || processing}
        onClick={handleProcess}
        className={cn(
          "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300",
          selectedType && !processing
            ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
            : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
        )}
      >
        {processing ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-400 border-t-white" />
        ) : (
          <>
            <Play className="h-5 w-5" />
            Start Processing
          </>
        )}
      </button>
    </div>
  );
}
