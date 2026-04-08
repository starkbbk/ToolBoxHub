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

  const [isReady, setIsReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  
  useEffect(() => {
    setIsReady(false);
    // Fail-safe: If player doesn't signal ready within 5s, force it (helps with origin issues)
    const timeout = setTimeout(() => {
      setIsReady(true);
    }, 5000);
    return () => clearTimeout(timeout);
  }, [url]);

  const [error, setError] = useState<string | null>(null);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#0a0a0a] border border-[#2a2a2a] group">
      {(!isReady || isBuffering) && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10 transition-opacity">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500/20 border-t-indigo-500" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 animate-pulse">
              {isBuffering ? "Buffering..." : "Loading Video..."}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-20 p-8 text-center">
          <div className="rounded-full bg-rose-500/10 p-4 mb-4">
            <Settings className="h-10 w-10 text-rose-500" />
          </div>
          <h4 className="text-lg font-bold text-white mb-2">Video Playback Error</h4>
          <p className="text-sm text-zinc-500 max-w-sm mb-6">
            We're having trouble loading the video preview. {error}
          </p>
          <button 
             onClick={() => { setError(null); setIsReady(false); }}
             className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold transition-all"
          >
            Retry Loading
          </button>
        </div>
      )}

      <ReactPlayer
        ref={playerRef}
        url={url}
        width="100%"
        height="100%"
        playing={playing}
        volume={volume}
        playbackRate={playbackRate}
        onProgress={(state: any) => onProgress(state)}
        onDuration={(d: number) => {
          onDuration(d);
        }}
        onReady={() => {
          setIsReady(true);
          setError(null);
        }}
        onBuffer={() => setIsBuffering(true)}
        onBufferEnd={() => setIsBuffering(false)}
        onError={(e: any) => {
          console.error("DEBUG: Player Error:", e);
          setIsReady(true);
          setError("The video format might be unsupported or the connection was interrupted.");
        }}
        progressInterval={100}
        controls={false}
        pip={false}
        config={{
          file: {
            attributes: {
              crossOrigin: "anonymous",
              controlsList: "nodownload"
            }
          },
          youtube: {
            playerVars: { 
              rel: 0, 
              modestbranding: 1,
              origin: typeof window !== 'undefined' ? window.location.origin : undefined,
              autoplay: 0,
              iv_load_policy: 3,
            }
          }
        }}
      />

      {/* Custom Controls Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 p-4 z-30">
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
