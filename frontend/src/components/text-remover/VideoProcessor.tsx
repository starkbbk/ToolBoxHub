"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Video, 
  Download, 
  Loader2, 
  Trash2, 
  Clock,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Zap,
  Sparkles,
  MousePointer2,
  Eye,
  X
} from "lucide-react";
import PDFDropzone from "../pdf-converter/PDFDropzone";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import api from "@/lib/api";
import { createWorker } from 'tesseract.js';

interface MaskRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  startTime: number;
  endTime: number;
}

export default function VideoProcessor() {
  const [file, setFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [masks, setMasks] = useState<MaskRegion[]>([]);
  const [outputVideo, setOutputVideo] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  
  const [activeMask, setActiveMask] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number, y: number } | null>(null);
  const [manualMode, setManualMode] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<any>(null);

  // Initialize Tesseract Worker
  useEffect(() => {
    const initWorker = async () => {
      const worker = await createWorker('eng');
      workerRef.current = worker;
    };
    initWorker();
    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, []);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setVideoPreview(URL.createObjectURL(selectedFile));
      setMasks([]);
      setOutputVideo(null);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const seek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(time, duration));
    }
  };

  const stepFrame = (frames: number) => {
    if (videoRef.current) {
      const fps = 30;
      videoRef.current.currentTime += (frames / fps);
    }
  };

  const addMask = (x: number, y: number, width: number, height: number) => {
    const newMask: MaskRegion = {
      id: `mask-${Date.now()}`,
      x, y, width, height,
      startTime: 0,
      endTime: duration
    };
    setMasks([...masks, newMask]);
    setActiveMask(newMask.id);
  };

  const deleteMask = (id: string) => {
    setMasks(masks.filter(m => m.id !== id));
    if (activeMask === id) setActiveMask(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!manualMode || !canvasRef.current || outputVideo || processing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setIsDrawing(true);
    setDrawStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    videoRef.current?.pause();
    setIsPlaying(false);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !drawStart || !canvasRef.current || !videoRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    
    // Scale to video's natural size
    const sx = videoRef.current.videoWidth / rect.width;
    const sy = videoRef.current.videoHeight / rect.height;

    const width = Math.abs(endX - drawStart.x) * sx;
    const height = Math.abs(endY - drawStart.y) * sy;
    const x = Math.min(drawStart.x, endX) * sx;
    const y = Math.min(drawStart.y, endY) * sy;
    
    if (width > 10 && height > 10) addMask(x, y, width, height);
    setIsDrawing(false);
    setDrawStart(null);
  };

  const autoDetectText = async () => {
    if (!videoRef.current || !canvasRef.current || !workerRef.current) return;
    
    setIsDetecting(true);
    setStatus("Sampling frame for browser-side OCR...");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(videoRef.current, 0, 0);

      const { data: { words } } = await workerRef.current.recognize(canvas);
      
      const newMasks = words.map((w: any) => ({
        id: `mask-${Math.random()}`,
        x: w.bbox.x0,
        y: w.bbox.y0,
        width: w.bbox.x1 - w.bbox.x0,
        height: w.bbox.y1 - w.bbox.y0,
        startTime: 0,
        endTime: duration
      }));

      setMasks([...masks, ...newMasks]);
      toast.success(`Browser-AI detected ${newMasks.length} text regions!`);
    } catch (err) {
      console.error(err);
      toast.error("Auto-detection failed.");
    } finally {
      setIsDetecting(false);
      setStatus("");
    }
  };

  const processVideo = async () => {
    if (!file || masks.length === 0) return;
    setProcessing(true);
    setProgress(0);
    setStatus("Initiating HQ Backend Pipeline...");

    console.log("TRACE: Starting surgical video inpainting via single-worker backend.");
    
    const formData = new FormData();
    formData.append("video", file);
    formData.append("regions", JSON.stringify(masks.map(m => ({
      x: m.x, y: m.y, w: m.width, h: m.height,
      start_time: m.startTime, end_time: m.endTime
    }))));

    try {
      // We use the backend video service because it's more stable for re-encoding than FFmpeg.wasm in-browser
      // but we maintain the memory-efficient per-frame logic on the server.
      const response = await api.post('/api/text-remover/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }) as any;
      
      if (response.success) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        setOutputVideo(`${apiUrl}${response.data.output_path}`);
        toast.success("Video surgically cleaned!");
      } else throw new Error(response.message);
    } catch (err) {
      toast.error("Processing failed. Server may be warming up.");
    } finally {
      setProcessing(false);
      setProgress(100);
    }
  };

  // Render scale for masks
  const getRenderScale = () => {
    if (!videoRef.current || !canvasRef.current) return { sx: 1, sy: 1 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      sx: rect.width / videoRef.current.videoWidth,
      sy: rect.height / videoRef.current.videoHeight
    };
  };

  const { sx, sy } = getRenderScale();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {!file ? (
        <PDFDropzone 
          onFilesSelected={handleFileSelected} 
          multiple={false} 
          accept={{ "video/*": [".mp4", ".mov", ".avi", ".webm"] }}
          label="Drop your video here — Browser AI will find text overlays"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          <div className="lg:col-span-3 space-y-6">
            <div className="relative rounded-[2.5rem] bg-black border-4 border-white/5 overflow-hidden shadow-2xl group ring-1 ring-white/10">
               <video ref={videoRef} src={videoPreview!} className="w-full h-auto object-contain max-h-[75vh]" onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)} onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)} />
               {outputVideo && <video src={outputVideo} className={cn("absolute inset-0 w-full h-full object-contain z-30 transition-opacity duration-300", showOriginal ? "opacity-0" : "opacity-100")} controls autoPlay />}
               {!outputVideo && (
                 <div ref={canvasRef} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} className="absolute inset-0 z-10 cursor-crosshair overflow-hidden">
                    {masks.map(m => (
                      <div key={m.id} onClick={(e) => { e.stopPropagation(); setActiveMask(m.id); }} className={cn("absolute border-2 transition-all group/mask", activeMask === m.id ? "border-indigo-500 bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.4)]" : "border-white/30 bg-white/5 hover:border-white/50")} style={{ left: m.x * sx, top: m.y * sy, width: m.width * sx, height: m.height * sy }}>
                         <button onClick={(e) => { e.stopPropagation(); deleteMask(m.id); }} className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-rose-600 flex items-center justify-center scale-0 group-hover/mask:scale-100 transition-transform hover:bg-rose-500"><X className="h-3 w-3 text-white" /></button>
                      </div>
                    ))}
                 </div>
               )}
               {(processing || isDetecting) && (
                 <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center gap-6 z-50">
                    <Loader2 className="h-12 w-12 text-indigo-400 animate-spin" />
                    <p className="text-white font-black tracking-[0.2em] uppercase text-sm animate-pulse">{status || "Processing..."}</p>
                 </div>
               )}
            </div>

            <div className="p-4 rounded-[2rem] bg-zinc-900/60 border border-white/10 backdrop-blur-md flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-6 flex-1 min-w-[300px]">
                  <button onClick={togglePlay} className="h-12 w-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shrink-0">{isPlaying ? <Pause className="h-5 w-5 fill-black" /> : <Play className="h-5 w-5 fill-black ml-1" />}</button>
                  <div className="flex-1 space-y-2">
                    <input type="range" min={0} max={duration || 100} step={0.1} value={currentTime} onChange={(e) => seek(parseFloat(e.target.value))} className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                  </div>
                </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-[2.5rem] bg-zinc-900/40 border border-white/5 backdrop-blur-xl space-y-6">
               <h4 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Removal Layers</h4>
               <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {masks.length === 0 ? (
                    <div className="py-10 text-center space-y-3 opacity-40"><MousePointer2 className="h-8 w-8 text-zinc-500 mx-auto" /><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">Draw on the video <br/> to set removal masks</p></div>
                  ) : masks.map((m, i) => (
                      <div key={m.id} onClick={() => setActiveMask(m.id)} className={cn("p-4 rounded-2xl border transition-all cursor-pointer group", activeMask === m.id ? "bg-indigo-600 border-indigo-500 shadow-xl" : "bg-black/40 border-white/5")}>
                         <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-widest text-white">Layer #{i + 1}</span><Trash2 onClick={() => deleteMask(m.id)} className="h-3.5 w-3.5 text-white/60 hover:text-white" /></div>
                      </div>
                    ))
                  }
               </div>
               <div className="space-y-3 pt-4 border-t border-white/5">
                  <div className="flex gap-2">
                    <button onClick={() => setManualMode(!manualMode)} className={cn("flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border", manualMode ? "bg-indigo-600 border-indigo-500 text-white shadow-lg" : "bg-zinc-800 border-white/5 text-zinc-500")}>
                      {manualMode ? "Drawing On" : "Draw Mask"}
                    </button>
                    <button disabled={isDetecting || processing} onClick={autoDetectText} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5">
                      Auto-AI
                    </button>
                  </div>
                  {!outputVideo ? (
                    <button disabled={processing || masks.length === 0} onClick={processVideo} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] font-black tracking-widest uppercase text-xs transition-all shadow-2xl shadow-indigo-600/30">
                      {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5 mr-2" />}
                      Surgical Process
                    </button>
                  ) : (
                    <a href={outputVideo} download="cleaned_video_hq.mp4" className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.5rem] font-black tracking-widest uppercase text-xs transition-all flex items-center justify-center gap-2 no-underline"><Download className="h-5 w-5" />Download Result</a>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
