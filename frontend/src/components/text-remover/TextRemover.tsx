"use client";

import { useState } from "react";
import { 
  Eraser, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Brush, 
  Sparkles, 
  Info,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import ImageProcessor from "./ImageProcessor";
import VideoProcessor from "./VideoProcessor";
import ThumbnailCleaner from "./ThumbnailCleaner";
import PageHeader from "../shared/PageHeader";

type RemoverMode = "image" | "video" | "thumbnail";

export default function TextRemover() {
  const [activeMode, setActiveMode] = useState<RemoverMode>("image");

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <PageHeader 
        title="Text & Thumbnail Remover"
        description="Clean up any media by removing text overlays, watermarks, and subtitles with AI-powered inpainting."
        icon={Eraser}
      />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Mode Switcher */}
        <div className="flex flex-wrap items-center justify-center gap-3 p-1.5 bg-zinc-950/50 backdrop-blur-xl rounded-2xl border border-white/5 w-fit mx-auto">
          {[
            { id: "image", icon: ImageIcon, label: "Images" },
            { id: "video", icon: VideoIcon, label: "Videos" },
            { id: "thumbnail", icon: Sparkles, label: "Thumbnails" },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id as RemoverMode)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeMode === mode.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              )}
            >
              <mode.icon className="h-4 w-4" />
              {mode.label}
            </button>
          ))}
        </div>

        {/* Tool Content */}
        <div className="min-h-[500px]">
          {activeMode === "image" && <ImageProcessor />}
          {activeMode === "video" && <VideoProcessor />}
          {activeMode === "thumbnail" && <ThumbnailCleaner />}
        </div>

        {/* FAQ / Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-white/5">
           <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                 <Maximize2 className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-white">Full Resolution</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                We preserve the original resolution and quality of your files. No compression is applied during removal.
              </p>
           </div>
           <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                 <Eraser className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-white">Smart Inpainting</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Our algorithms sample surrounding pixels to fill gaps, creating a seamless background restoration.
              </p>
           </div>
           <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                 <Brush className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-white">Manual Control</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                If auto-detection misses a translucent watermark, use the manual brush to highlight it yourself.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
