"use client";

import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { 
  AlignLeft, 
  Copy, 
  Download, 
  Loader2, 
  Sparkles,
  RefreshCcw,
  Check,
  FileText,
  Clock,
  Layout
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function TextSummarizerPage() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [style, setStyle] = useState("balanced");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleSummarize = async () => {
    if (!text || text.length < 50) {
      toast.error("Please enter at least 50 characters to summarize.");
      return;
    }

    setIsProcessing(true);
    setSummary("");
    
    try {
      const response = await axios.post(`${apiBase}/api/text-summarizer/summarize`, {
        text,
        style
      });

      if (response.data.success) {
        setSummary(response.data.data.summary);
        toast.success("Summary generated!");
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to generate summary. Make sure the backend is running and API keys are configured.");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  const downloadSummary = () => {
    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "summary.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const wordCount = (str: string) => str.trim().split(/\s+/).filter(Boolean).length;
  const charCount = (str: string) => str.length;

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4">
      <PageHeader
        icon="📝"
        title="AI Text Summarizer"
        description="Transform long articles and documents into concise, actionable summaries using advanced AI."
      />

      <div className="mt-12 flex flex-col gap-8">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-6 bg-zinc-900/50 p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-400 ml-2">Summary Style:</span>
            <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
              {[
                { id: "concise", label: "Concise", icon: Clock },
                { id: "balanced", label: "Balanced", icon: Layout },
                { id: "detailed", label: "Detailed", icon: FileText },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm font-medium",
                    style === s.id 
                      ? "bg-indigo-600 text-white shadow-lg" 
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <s.icon className="h-4 w-4" />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={!text || isProcessing}
            onClick={handleSummarize}
            className={cn(
              "px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all",
              !text || isProcessing
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:scale-105 active:scale-95"
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Summarizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>Generate Summary</span>
              </>
            )}
          </button>
        </div>

        {/* Editor Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[500px]">
          {/* Input Pane */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between ml-2">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Input Text
              </h3>
              <div className="flex gap-4 text-[10px] font-black uppercase tracking-tighter">
                <span className={cn(charCount(text) > 0 ? "text-indigo-400" : "text-zinc-700")}>
                  {charCount(text)} Chars
                </span>
                <span className={cn(wordCount(text) > 0 ? "text-indigo-400" : "text-zinc-700")}>
                  {wordCount(text)} Words
                </span>
              </div>
            </div>
            <div className="relative flex-1 group">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your long text here (min 50 chars)..."
                className="w-full h-full min-h-[400px] bg-zinc-900/40 border border-white/5 rounded-3xl p-8 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none backdrop-blur-sm"
              />
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setText("")}
                  className="p-2 bg-zinc-800 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 rounded-xl transition-all"
                >
                  <RefreshCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Output Pane */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between ml-2">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                AI Summary
              </h3>
              {summary && (
                <div className="flex gap-2">
                  <button 
                    onClick={copyToClipboard}
                    className="p-2 bg-zinc-800 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl transition-all flex items-center gap-2 text-[10px] font-bold uppercase"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button 
                    onClick={downloadSummary}
                    className="p-2 bg-zinc-800 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl transition-all flex items-center gap-2 text-[10px] font-bold uppercase"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export
                  </button>
                </div>
              )}
            </div>
            
            <div className={cn(
              "relative flex-1 rounded-3xl border transition-all duration-500 min-h-[400px]",
              summary 
                ? "bg-indigo-500/5 border-indigo-500/20" 
                : "bg-zinc-900/20 border-white/5 border-dashed"
            )}>
              <div className="absolute inset-0 p-8 overflow-y-auto text-zinc-300 leading-relaxed whitespace-pre-wrap">
                <AnimatePresence mode="wait">
                  {!summary && !isProcessing ? (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center text-center space-y-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
                        <AlignLeft className="h-8 w-8 text-zinc-800" />
                      </div>
                      <p className="text-zinc-600 text-sm max-w-[200px]">
                        Your summary will appear here once generated.
                      </p>
                    </motion.div>
                  ) : isProcessing ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center space-y-6"
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400" />
                      </div>
                      <div className="space-y-2 text-center">
                        <p className="text-white font-medium">Analyzing text...</p>
                        <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest">Powered by Llama-3.3</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="animate-in fade-in duration-700"
                    >
                      {summary}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
