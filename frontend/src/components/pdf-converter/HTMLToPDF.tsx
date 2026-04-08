"use client";

import { useState } from "react";
import { 
  Code, 
  Download, 
  Loader2, 
  X,
  Globe,
  ArrowRight,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

let html2pdf: any;
if (typeof window !== "undefined") {
  import("html2pdf.js").then((module) => {
    html2pdf = module.default;
  });
}

export default function HTMLToPDF() {
  const [inputType, setInputType] = useState<"code" | "url">("code");
  const [htmlCode, setHtmlCode] = useState("");
  const [url, setUrl] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleConvert = async () => {
    if (inputType === "code" && !htmlCode.trim()) {
      toast.error("Please enter some HTML code");
      return;
    }
    if (inputType === "url" && !url.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }

    setProcessing(true);
    try {
      let finalHtml = htmlCode;

      if (inputType === "url") {
        // We'd typically use a backend proxy for this to avoid CORS
        // For now, we'll try to fetch or show a message if it fails
        try {
          // Mocking backend fetch for implementation demonstration
          // In a real scenario, use: const res = await fetch(`/api/pdf-converter/fetch-url?url=${encodeURIComponent(url)}`);
          toast.info("Fetching remote content...");
          const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
          const data = await response.json();
          finalHtml = data.contents;
        } catch (err) {
          throw new Error("Could not fetch URL content. Try pasting the HTML code directly.");
        }
      }

      const element = document.createElement("div");
      element.innerHTML = finalHtml;
      
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `webpage_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().from(element).set(opt).save();
      toast.success("HTML converted to PDF successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to convert HTML to PDF");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Type Selector */}
      <div className="flex p-1 bg-zinc-900 border border-white/5 rounded-2xl w-fit mx-auto">
        <button
          onClick={() => setInputType("code")}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
            inputType === "code" ? "bg-indigo-600 text-white" : "text-zinc-500 hover:text-white"
          )}
        >
          HTML Code
        </button>
        <button
          onClick={() => setInputType("url")}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
            inputType === "url" ? "bg-indigo-600 text-white" : "text-zinc-500 hover:text-white"
          )}
        >
          Website URL
        </button>
      </div>

      <div className="space-y-6">
        {inputType === "code" ? (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-widest">
              <Code className="h-4 w-4" />
              Paste HTML Code
            </label>
            <textarea
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              placeholder="<html><body><h1>Hello World</h1></body></html>"
              className="w-full h-64 bg-zinc-950 border border-white/10 rounded-3xl p-6 text-sm font-mono text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none custom-scrollbar"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-widest">
              <Globe className="h-4 w-4" />
              Enter Web URL
            </label>
            <div className="flex gap-4">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 bg-zinc-950 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleConvert}
          disabled={processing}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:scale-[1.02] active:scale-[0.98]"
        >
          {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
          {inputType === "code" ? "Generate PDF from HTML" : "Convert Website to PDF"}
        </button>
      </div>

      <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-center">
         <p className="text-xs text-indigo-300 leading-relaxed italic">
           Note: Direct URL conversion depends on the website's CORS policy. For complex sites, we recommend pasting the HTML content directly.
         </p>
      </div>
    </div>
  );
}
