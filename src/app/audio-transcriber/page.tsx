"use client";

import { useState, useRef, useEffect } from "react";
import PageHeader from "@/components/shared/PageHeader";
import PDFDropzone from "@/components/pdf-converter/PDFDropzone";
import { 
  Mic, 
  Download, 
  Loader2, 
  Copy, 
  Play, 
  Pause, 
  Clock, 
  FileText,
  Volume2,
  Check,
  CheckCircle2,
  X,
  Languages
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
  segments: TranscriptSegment[];
}

export default function AudioTranscriberPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setResult(null);
      const url = URL.createObjectURL(selectedFile);
      setAudioUrl(url);
    }
  };

  const startTranscription = async () => {
    if (!file) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${apiBase}/api/audio-transcriber/transcribe`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        setResult(response.data.data);
        toast.success("Transcription complete!");
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Transcription failed. Please check the backend and API keys.");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Transcript copied");
  };

  const downloadTranscript = (format: 'txt' | 'srt') => {
    if (!result) return;
    
    let content = "";
    if (format === 'txt') {
      content = result.text;
    } else {
      content = result.segments.map((s, i) => {
        const formatTime = (sec: number) => {
          const date = new Date(sec * 1000);
          const hh = date.getUTCHours().toString().padStart(2, '0');
          const mm = date.getUTCMinutes().toString().padStart(2, '0');
          const ss = date.getUTCSeconds().toString().padStart(2, '0');
          const ms = date.getUTCMilliseconds().toString().padStart(3, '0');
          return `${hh}:${mm}:${ss},${ms}`;
        };
        return `${i + 1}\n${formatTime(s.start)} --> ${formatTime(s.end)}\n${s.text}\n`;
      }).join('\n');
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4">
      <PageHeader
        icon="🎙️"
        title="Audio Transcriber"
        description="Convert your recordings, podcasts, and interviews into accurate text using Groq's lightning-fast Whisper API."
      />

      <div className="mt-12 flex flex-col gap-8">
        {!file ? (
          <PDFDropzone 
            onFilesSelected={handleFileSelected}
            accept={{ "audio/*": [".mp3", ".wav", ".m4a", ".flac"] }}
            label="Upload an audio file to transcribe"
            className="h-[400px]"
          />
        ) : !result ? (
          <div className="max-w-2xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex items-center gap-4 rounded-3xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-sm">
                <div className="rounded-2xl bg-indigo-500/10 p-4 text-indigo-400">
                  <Volume2 className="h-8 w-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate text-lg">{file.name}</p>
                  <p className="text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                {!isProcessing && (
                  <button 
                    onClick={() => setFile(null)}
                    className="p-3 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all"
                  >
                    <X className="h-6 w-6" />
                  </button>
                )}
             </div>

             <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/20 rounded-3xl border border-white/5 border-dashed">
                {isProcessing ? (
                  <div className="text-center space-y-4">
                    <div className="relative h-20 w-20 mx-auto">
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin" />
                      <Mic className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-indigo-400 animate-pulse" />
                    </div>
                    <p className="text-white font-medium">Transcribing with Groq Whisper...</p>
                    <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest">Speed: ~10x Real-time</p>
                  </div>
                ) : (
                  <button
                    onClick={startTranscription}
                    className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-bold flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(79,70,229,0.3)]"
                  >
                    <Languages className="h-6 w-6" />
                    Start Transcription
                  </button>
                )}
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Audio Controls */}
            <div className="lg:col-span-1 space-y-6 sticky top-24">
               <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-6 backdrop-blur-xl shadow-2xl">
                  <div className="h-48 w-full bg-gradient-to-br from-indigo-500/20 to-violet-500/10 rounded-2xl mb-6 flex items-center justify-center border border-white/5 relative overflow-hidden group">
                     <Mic className="h-20 w-20 text-indigo-500/40 group-hover:scale-110 transition-transform duration-700" />
                     <div className="absolute inset-0 bg-black/20" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-widest">
                       <span>{formatTime(currentTime)}</span>
                       <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(result.duration)}</span>
                       </div>
                    </div>
                    
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-indigo-500 transition-all"
                         style={{ width: `${(currentTime / result.duration) * 100}%` }}
                       />
                    </div>

                    <div className="flex items-center justify-center gap-6 pt-2">
                       <button 
                         onClick={() => {
                           if (audioRef.current) {
                             if (isPlaying) audioRef.current.pause();
                             else audioRef.current.play();
                             setIsPlaying(!isPlaying);
                           }
                         }}
                         className="h-16 w-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform active:scale-95 shadow-xl"
                       >
                         {isPlaying ? <Pause className="h-8 w-8 fill-current" /> : <Play className="h-8 w-8 fill-current ml-1" />}
                       </button>
                    </div>

                    <audio 
                       ref={audioRef}
                       src={audioUrl}
                       onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                       onEnded={() => setIsPlaying(false)}
                       className="hidden"
                    />
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-500">Language</span>
                        <span className="text-white font-bold uppercase">{result.language}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-500">Duration</span>
                        <span className="text-white font-bold">{formatTime(result.duration)}</span>
                     </div>
                  </div>
               </div>

               <div className="flex gap-3">
                  <button 
                    onClick={() => { setFile(null); setResult(null); }}
                    className="flex-1 py-4 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 border border-white/5 rounded-2xl font-bold transition-all"
                  >
                    Start New
                  </button>
                  <button 
                    onClick={() => downloadTranscript('srt')}
                    className="flex-1 py-4 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 border border-white/5 rounded-2xl font-bold transition-all"
                  >
                    Export SRT
                  </button>
               </div>
            </div>

            {/* Transcript Area */}
            <div className="lg:col-span-2 space-y-6">
               <div className="flex items-center justify-between ml-2">
                  <h3 className="text-lg font-bold text-white flex items-center gap-3">
                    <FileText className="h-5 w-5 text-indigo-400" />
                    Full Transcript
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={copyToClipboard}
                      className="px-4 py-2 bg-zinc-900/50 border border-white/5 hover:bg-white/5 text-zinc-400 hover:text-white rounded-xl transition-all flex items-center gap-2 text-xs font-bold uppercase"
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Copied" : "Copy All"}
                    </button>
                    <button 
                      onClick={() => downloadTranscript('txt')}
                      className="px-4 py-2 bg-zinc-900/50 border border-white/5 hover:bg-white/5 text-zinc-400 hover:text-white rounded-xl transition-all flex items-center gap-2 text-xs font-bold uppercase"
                    >
                      <Download className="h-4 w-4" />
                      Save TXT
                    </button>
                  </div>
               </div>

               <div className="rounded-3xl border border-white/5 bg-zinc-900/20 p-8 min-h-[600px] backdrop-blur-sm">
                  <div className="space-y-6">
                    {result.segments.map((segment, i) => {
                      const isActive = currentTime >= segment.start && currentTime <= segment.end;
                      return (
                        <div 
                          key={i} 
                          onClick={() => {
                            if (audioRef.current) {
                              audioRef.current.currentTime = segment.start;
                              if (!isPlaying) {
                                audioRef.current.play();
                                setIsPlaying(true);
                              }
                            }
                          }}
                          className={cn(
                            "group flex gap-6 p-4 rounded-2xl transition-all duration-300 cursor-pointer",
                            isActive ? "bg-indigo-500/10 border border-indigo-500/20 shadow-lg scale-[1.01]" : "hover:bg-white/5 border border-transparent"
                          )}
                        >
                          <span className={cn(
                            "text-[10px] font-black w-14 shrink-0 transition-colors pt-1",
                            isActive ? "text-indigo-400" : "text-zinc-700 group-hover:text-zinc-500"
                          )}>
                            {formatTime(segment.start)}
                          </span>
                          <p className={cn(
                            "text-sm leading-relaxed transition-colors",
                            isActive ? "text-white font-medium" : "text-zinc-400 group-hover:text-zinc-200"
                          )}>
                            {segment.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
