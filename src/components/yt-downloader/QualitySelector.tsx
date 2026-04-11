"use client";

import React from 'react';
import { FormatInfo } from '@/lib/types';
import { Check, Star, Monitor, Music, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QualitySelectorProps {
  formats: FormatInfo[];
  selectedFormatId: string | null;
  onSelect: (formatId: string) => void;
}

export default function QualitySelector({ formats, selectedFormatId, onSelect }: QualitySelectorProps) {
  const getTierColor = (label: string) => {
    switch (label) {
      case '2160p': return 'from-amber-400 to-orange-600';
      case '1440p': return 'from-purple-400 to-indigo-600';
      case '1080p': return 'from-blue-400 to-cyan-600';
      case '720p': return 'from-green-400 to-emerald-600';
      case 'audio': return 'from-pink-400 to-rose-600';
      default: return 'from-zinc-400 to-zinc-600';
    }
  };

  const getTierBorder = (label: string) => {
    switch (label) {
      case '2160p': return 'border-amber-500/50';
      case '1440p': return 'border-purple-500/50';
      case '1080p': return 'border-blue-500/50';
      case '720p': return 'border-green-500/50';
      case 'audio': return 'border-pink-500/50';
      default: return 'border-zinc-500/50';
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black uppercase tracking-tighter text-white">Select Quality</h3>
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
          {formats.length} Formats Available
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {formats.map((format) => {
          const isSelected = selectedFormatId === format.format_id;
          const is4K = format.quality_label === '2160p';
          const isAudio = format.quality_label === 'audio';

          return (
            <button
              key={format.format_id}
              onClick={() => onSelect(format.format_id)}
              className={cn(
                "group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left overflow-hidden",
                isSelected 
                  ? "bg-secondary/50 border-white/20 shadow-xl shadow-black/20" 
                  : "bg-secondary/10 border-white/5 hover:border-white/10 hover:bg-secondary/20",
                !format.is_available && "opacity-40 cursor-not-allowed grayscale"
              )}
              disabled={!format.is_available}
            >
              {/* Highlight Bar */}
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b opacity-0 transition-opacity",
                getTierColor(format.quality_label),
                isSelected ? "opacity-100" : "group-hover:opacity-100"
              )} />

              {/* Icon */}
              <div className={cn(
                "p-3 rounded-xl bg-secondary/50 text-white shadow-inner transition-transform group-hover:scale-110",
                isSelected && "bg-white/10"
              )}>
                {isAudio ? <Music className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">
                    {format.quality_label === 'audio' ? 'Audio Only (MP3/M4A)' : format.quality_label}
                  </span>
                  {is4K && (
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-500 text-[8px] font-black uppercase tracking-widest border border-amber-500/30">
                      Best
                    </span>
                  )}
                  {format.needs_merge && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-popover border-border p-2 text-[10px] font-bold">
                          Video & Audio will be merged automatically
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <span>{format.extension.toUpperCase()}</span>
                  <span>•</span>
                  <span>{format.file_size_display}</span>
                  {format.fps && (
                    <>
                      <span>•</span>
                      <span>{format.fps} FPS</span>
                    </>
                  )}
                </div>
              </div>

              {/* Check */}
              <div className={cn(
                "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                isSelected 
                  ? "bg-white border-white text-black scale-100" 
                  : "border-white/5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
              )}>
                <Check className="h-3.5 w-3.5" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
