"use client";

import dynamic from "next/dynamic";
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;
import { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, Maximize, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  url: string;
  onProgress: (state: any) => void;
  onDuration: (duration: number) => void;
  seekTo?: number | null;
  isPlaying?: boolean;
}

export default function VideoPlayer({ url, onProgress, onDuration, seekTo, isPlaying }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (isPlaying !== undefined) {
      setPlaying(isPlaying);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (seekTo !== null && seekTo !== undefined) {
      playerRef.current?.seekTo(seekTo, "seconds");
      setPlaying(true);
    }
  }, [seekTo]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black border border-[#2a2a2a] group">
      <ReactPlayer
        ref={playerRef}
        url={url}
        width="100%"
        height="100%"
        playing={playing}
        volume={volume}
        playbackRate={playbackRate}
        onProgress={(state: any) => onProgress(state)}
        onDuration={onDuration}
        progressInterval={100}
        controls={false}
      />

      {/* Custom Controls Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 p-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setPlaying(!playing)}
            className="rounded-full bg-white/10 p-2 backdrop-blur-md hover:bg-white/20 transition-colors"
          >
            {playing ? <Pause className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-white" />}
          </button>

          <div className="flex items-center gap-2 group/volume">
            <Volume2 className="h-5 w-5 text-zinc-400" />
            <input 
              type="range" 
              min={0} 
              max={1} 
              step="any" 
              value={volume} 
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <select 
              value={playbackRate} 
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              className="bg-transparent text-xs font-bold text-zinc-400 outline-none hover:text-white cursor-pointer"
            >
              <option value="0.5">0.5x</option>
              <option value="1.0">1.0x</option>
              <option value="1.5">1.5x</option>
              <option value="2.0">2.0x</option>
            </select>
            <Maximize className="h-5 w-5 text-zinc-400 hover:text-white cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );
}
