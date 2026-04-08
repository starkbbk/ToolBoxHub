"use client";

import { Clip } from "@/lib/types";
import ClipCard from "./ClipCard";
import { useClipStore } from "@/stores/useClipStore";

interface ClipListProps {
  clips: Clip[];
  activeClipId: number | null;
  onPlay: (seconds: number, clipId: number) => void;
  onEdit: (clip: Clip) => void;
  onApprove: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function ClipList({ clips, activeClipId, onPlay, onEdit, onApprove, onDelete }: ClipListProps) {
  if (clips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-[#2a2a2a] rounded-3xl">
        <p className="text-zinc-500 font-medium">No clips match your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 overflow-y-auto pr-2 max-h-[calc(100vh-350px)] custom-scrollbar">
      {clips.map((clip) => (
        <ClipCard
          key={clip.id}
          clip={clip}
          isActive={activeClipId === clip.id}
          onPlay={(sec) => onPlay(sec, clip.id)}
          onEdit={onEdit}
          onApprove={onApprove}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
