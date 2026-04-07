"use client";

import { Clip } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TimelineProps {
  duration: number;
  currentTime: number;
  clips: Clip[];
  onSeek: (seconds: number) => void;
}

export default function Timeline({ duration, currentTime, clips, onSeek }: TimelineProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "highlight": return "bg-blue-500";
      case "funny": return "bg-yellow-500";
      case "emotional": return "bg-purple-500";
      case "key_point": return "bg-green-500";
      case "topic_change": return "bg-orange-500";
      case "quote": return "bg-pink-500";
      case "action_item": return "bg-red-500";
      default: return "bg-zinc-500";
    }
  };

  return (
    <div className="relative w-full h-10 mt-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden group cursor-pointer"
         onClick={(e) => {
           const rect = e.currentTarget.getBoundingClientRect();
           const x = e.clientX - rect.left;
           const pct = x / rect.width;
           onSeek(pct * duration);
         }}>
      
      {/* Clips Markers */}
      {clips.map((clip) => {
        const left = (clip.start_seconds / duration) * 100;
        const width = ((clip.end_seconds - clip.start_seconds) / duration) * 100;
        
        return (
          <div
            key={clip.id}
            className={cn(
              "absolute top-0 h-full opacity-40 transition-opacity hover:opacity-80",
              getCategoryColor(clip.category)
            )}
            style={{ left: `${left}%`, width: `${width}%` }}
            title={`${clip.title} (${clip.start_time} - ${clip.end_time})`}
          />
        );
      })}

      {/* Playback Progress */}
      <div 
        className="absolute top-0 bottom-0 left-0 bg-indigo-500/20 pointer-events-none"
        style={{ width: `${(currentTime / duration) * 100}%` }}
      />

      {/* Current Time Indicator */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_white] z-10 pointer-events-none transition-[left] duration-100 ease-linear"
        style={{ left: `${(currentTime / duration) * 100}%` }}
      />
    </div>
  );
}
