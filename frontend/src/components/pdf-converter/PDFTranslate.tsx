"use client";

import { useState } from "react";
import * as pdfjs from "pdfjs-dist/build/pdf";
import { 
  Languages, 
  Download, 
  Loader2, 
  X,
  Copy,
  FileText,
  Globe,
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

const SUPPORTED_LANGUAGES = [
  "Spanish", "French", "German", "Chinese", "Japanese", "Hindi", "Arabic", "Portuguese", "Russian", "Italian", "Korean"
];

export default function PDFTranslate() {
  const [file, setFile] = useState<File | null>(null);
  const [translatedText, setTranslatedText] = useState("");
  const [targetLang, setTargetLang] = useState("Spanish");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const runTranslate = async () => {
    if (!file) return;

    setProcessing(true);
    setTranslatedText("");
    setProgress(10);

    try {
      // Step 1: Extract Text
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      let fullText = "";

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n";
        setProgress(Math.round((i / numPages) * 30) + 10);
      }

      // Step 2: Send to Backend
      setProgress(50);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/text-summarizer/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fullText, target_language: targetLang }),
      });

      const data = await response.json();
      if (data.status === "success") {
        setTranslatedText(data.data.translatedText);
        setProgress(100);
        toast.success(`PDF translated to ${targetLang}!`);
      } else {
        throw new Error(data.message || "Translation failed");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to translate PDF");
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(translatedText);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!file ? (
        <PDFDropzone onFilesSelected={handleFileSelected} multiple={false} label="Select a PDF to translate with AI" />
      ) : (
        <div className="space-y-8">
           {/* Header Info */}
           <div className="flex items-center gap-4 p-6 rounded-3xl border border-white/5 bg-zinc-950/50 backdrop-blur-xl">
             <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
               <Languages className="h-6 w-6" />
             </div>
             <div className="flex-1">
               <h3 className="font-bold text-white mb-0.5">{file.name}</h3>
               <p className="text-xs text-zinc-500">AI-Powered Multi-language Translation</p>
             </div>
             <button onClick={() => setFile(null)} className="p-2.5 text-zinc-500 hover:text-white transition-all">
                <X className="h-5 w-5" />
             </button>
           </div>

           {!translatedText && !processing && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Options Panel */}
                <div className="md:col-span-1 p-8 rounded-3xl border border-white/5 bg-zinc-900/40 space-y-6">
                   <div className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-widest">
                      <Globe className="h-4 w-4" />
                      Target Language
                   </div>
                   
                   <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {SUPPORTED_LANGUAGES.map(lang => (
                        <button
                          key={lang}
                          onClick={() => setTargetLang(lang)}
                          className={cn(
                            "w-full px-4 py-3 rounded-xl text-xs font-bold transition-all border text-left flex items-center justify-between",
                            targetLang === lang 
                              ? "bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/10"
                              : "bg-zinc-800/50 border-white/5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                          )}
                        >
                          {lang}
                          {targetLang === lang && <ArrowRight className="h-3 w-3" />}
                        </button>
                      ))}
                   </div>

                   <div className="pt-4">
                      <button
                        onClick={runTranslate}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:scale-[1.02]"
                      >
                        <Languages className="h-5 w-5" />
                        Translate PDF
                      </button>
                   </div>
                </div>

                {/* Info Panel */}
                <div className="md:col-span-2 p-12 bg-zinc-950/50 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-6 text-center">
                   <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
                      <Globe className="h-12 w-12 text-zinc-700" />
                   </div>
                   <div className="space-y-2">
                      <h4 className="text-xl font-bold text-white">Global Reach with AI</h4>
                      <p className="text-sm text-zinc-500 max-w-sm mx-auto">Translate academic papers, legal documents, or business reports into 10+ languages instantly.</p>
                   </div>
                </div>
             </div>
           )}

           {processing && (
             <div className="flex flex-col items-center justify-center p-20 bg-zinc-900/40 rounded-3xl border border-white/5 gap-8">
                <div className="relative h-24 w-24">
                   <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin" />
                   <div className="absolute inset-0 flex items-center justify-center text-indigo-400 font-bold italic">
                      AI Translating...
                   </div>
                </div>
                <div className="text-center space-y-3">
                   <p className="text-white font-medium">Processing language patterns and localizing text...</p>
                   <div className="w-64 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                   </div>
                </div>
             </div>
           )}

           {translatedText && (
             <div className="space-y-4 scale-in duration-500">
                <div className="flex items-center justify-between">
                   <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      Translated Result ({targetLang})
                   </label>
                   <button 
                    onClick={copyToClipboard}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all flex items-center gap-2"
                   >
                     <Copy className="h-3 w-3" /> Copy Translation
                   </button>
                </div>
                <div className="p-10 bg-zinc-950 border border-white/10 rounded-[40px] text-zinc-300 leading-relaxed shadow-2xl transition-all hover:border-indigo-500/30">
                   <div className="prose prose-invert prose-sm max-w-none">
                      {translatedText.split('\n').map((para, i) => (
                        <p key={i} className="mb-4 last:mb-0">{para}</p>
                      ))}
                   </div>
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
