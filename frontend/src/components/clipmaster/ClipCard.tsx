"use client";

import { useState } from "react";
import { Clip } from "@/lib/types";
import { cn, formatTimestamp } from "@/lib/utils";
import { Play, Edit2, Check, Trash2, Clock, Info } from "lucide-react";

interface ClipCardProps {
  clip: Clip;
  isActive: boolean;
  onPlay: (seconds: number) => void;
  onEdit: (clip: Clip) => void;
  onApprove: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function ClipCard({ clip, isActive, onPlay, onEdit, onApprove, onDelete }: ClipCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case "highlight": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "funny": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "emotional": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "key_point": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "topic_change": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "quote": return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      case "action_item": return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-blue-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div 
      className={cn(
        "group relative flex flex-col rounded-2xl border transition-all duration-300 p-5",
        isActive 
          ? "border-indigo-500/50 bg-[#222222] shadow-[0_0_20px_rgba(99,102,241,0.1)]" 
          : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a] hover:bg-[#202020]",
        clip.is_approved && !isActive && "border-green-500/30"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
          getCategoryStyles(clip.category)
        )}>
          {clip.category.replace("_", " ")}
        </div>
        <div className={cn("text-xs font-bold", getConfidenceColor(clip.confidence))}>
          {clip.confidence}%
        </div>
      </div>

      {/* Title */}
      <h4 className="font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors">
        {clip.title}
      </h4>

      {/* Time and Duration */}
      <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>{clip.start_time} → {clip.end_time}</span>
        </div>
        <span className="text-zinc-700">|</span>
        <span>{formatTimestamp(clip.end_seconds - clip.start_seconds)}</span>
      </div>

      {/* Reason */}
      <div className="flex items-start gap-2 mb-6">
        <Info className="h-3.5 w-3.5 mt-0.5 text-zinc-600 flex-shrink-0" />
        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 italic">
          {clip.reason}
        </p>
      </div>

      {/* Actions */}
      <div className="mt-auto flex items-center justify-between border-t border-[#2a2a2a] pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onPlay(clip.start_seconds)}
            className="p-2 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-colors"
            title="Play Clip"
          >
            <Play className="h-4 w-4" />
          </button>
          <button 
            onClick={() => onEdit(clip)}
            className="p-2 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
            title="Edit Clip"
          >
            <Edit2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => onApprove(clip.id)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              clip.is_approved ? "text-green-500 bg-green-500/10" : "text-zinc-400 hover:bg-green-500/10 hover:text-green-500"
            )}
            title="Approve"
          >
            <Check className="h-4 w-4" />
          </button>
          <button 
            onClick={() => onDelete(clip.id)}
            className="p-2 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Active Indicator Line */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-indigo-500 rounded-r-full" />
      )}
    </div>
  );
}
