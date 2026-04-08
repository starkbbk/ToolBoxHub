"use client";

import { useState, useRef } from "react";
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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      if (selectedFile.size > 100 * 1024 * 1024) {
        toast.error("Video exceeds 100MB limit.");
        return;
      }
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
    if (!canvasRef.current || outputVideo || processing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setIsDrawing(true);
    setDrawStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    videoRef.current?.pause();
    setIsPlaying(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !drawStart || !canvasRef.current) return;
    setCurrentTime(videoRef.current?.currentTime || 0); 
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !drawStart || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    const width = Math.abs(endX - drawStart.x);
    const height = Math.abs(endY - drawStart.y);
    const x = Math.min(drawStart.x, endX);
    const y = Math.min(drawStart.y, endY);
    if (width > 10 && height > 10) addMask(x, y, width, height);
    setIsDrawing(false);
    setDrawStart(null);
  };

  const autoDetectText = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (videoRef.current.videoWidth === 0) {
        toast.error("Video is not ready yet. Please wait.");
        return;
    }

    setIsDetecting(true);
    setStatus("Capturing frame...");

    try {
      // Capture current frame to canvas then blob
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(videoRef.current, 0, 0);

      setStatus("Sending to AI backend...");

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(b => b ? resolve(b) : reject(new Error("Failed to capture frame")), "image/jpeg", 0.9)
      );

      const formData = new FormData();
      formData.append("image", blob, "frame.jpg");

      // Use shared api instance instead of fetch
      const res = await api.post("/api/text-remover/detect", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      // api instance already returns json.data due to interceptor
      const json = res as any;
      if (!json.success) throw new Error(json.message || "Detection failed");

      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = rect.width / videoRef.current.videoWidth;
      const scaleY = rect.height / videoRef.current.videoHeight;

      const newMasks = json.data.regions.map((r: any) => ({
        id: `mask-${Math.random()}`,
        x: r.x * scaleX,
        y: r.y * scaleY,
        width: r.w * scaleX,
        height: r.h * scaleY,
        startTime: 0,
        endTime: duration
      }));

      setMasks([...masks, ...newMasks]);
      toast.success(`Automatically detected ${newMasks.length} text regions!`);
    } catch (err) {
      console.error(err);
      toast.error("Auto-detection failed. Is the backend running?");
    } finally {
      setIsDetecting(false);
      setStatus("");
    }
  };

  const processVideo = async () => {
    if (!file || masks.length === 0) {
      toast.error("Please add at least one removal mask.");
      return;
    }
    setProcessing(true);
    setProgress(0);
    setStatus("Uploading video...");

    const formData = new FormData();
    formData.append("video", file);
    const rect = canvasRef.current?.getBoundingClientRect();
    const scaleX = (videoRef.current?.videoWidth || 1) / (rect?.width || 1);
    const scaleY = (videoRef.current?.videoHeight || 1) / (rect?.height || 1);

    formData.append("regions", JSON.stringify(masks.map(m => ({
      x: m.x * scaleX, y: m.y * scaleY, w: m.width * scaleX, h: m.height * scaleY,
      start_time: m.startTime, end_time: m.endTime
    }))));

    try {
      const response = await api.post('/api/text-remover/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }) as any;
      
      if (response.success) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        setOutputVideo(`${apiUrl}${response.data.output_path}`);
        toast.success("Video cleaned successfully!");
      } else throw new Error(response.message);
    } catch (err) {
      toast.error("Processing failed.");
    } finally {
      setProcessing(false);
      setProgress(100);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {!file ? (
        <PDFDropzone 
          onFilesSelected={handleFileSelected} 
          multiple={false} 
          accept={{ "video/*": [".mp4", ".mov", ".avi", ".webm"] }}
          label="Drop your video here to begin surgical text removal"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          <div className="lg:col-span-3 space-y-6">
            <div className="relative rounded-[2.5rem] bg-black border-4 border-white/5 overflow-hidden shadow-2xl group ring-1 ring-white/10">
               <video ref={videoRef} src={videoPreview!} className="w-full h-auto object-contain max-h-[75vh]" onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)} onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)} />
               {outputVideo && <video src={outputVideo} className={cn("absolute inset-0 w-full h-full object-contain z-30 transition-opacity duration-300", showOriginal ? "opacity-0" : "opacity-100")} controls autoPlay />}
               {!outputVideo && (
                 <div ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} className="absolute inset-0 z-10 cursor-crosshair overflow-hidden">
                    {masks.map(m => (
                      <div key={m.id} onClick={(e) => { e.stopPropagation(); setActiveMask(m.id); }} className={cn("absolute border-2 transition-all group/mask", activeMask === m.id ? "border-indigo-500 bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.4)]" : "border-white/30 bg-white/5 hover:border-white/50")} style={{ left: m.x, top: m.y, width: m.width, height: m.height }}>
                         <button onClick={(e) => { e.stopPropagation(); deleteMask(m.id); }} className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-rose-600 flex items-center justify-center scale-0 group-hover/mask:scale-100 transition-transform hover:bg-rose-500"><X className="h-3 w-3 text-white" /></button>
                      </div>
                    ))}
                 </div>
               )}
               {(processing || isDetecting) && (
                 <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center gap-6 z-50">
                    <div className="relative h-32 w-32">
                       <div className="absolute inset-0 rounded-full border-[6px] border-indigo-500/10 border-t-indigo-500 animate-spin" />
                       <div className="absolute inset-0 flex items-center justify-center">{isDetecting ? <Sparkles className="h-12 w-12 text-indigo-400 animate-pulse" /> : <Loader2 className="h-12 w-12 text-indigo-400 animate-spin" />}</div>
                    </div>
                    <div className="text-center space-y-4 max-w-sm px-6">
                       <p className="text-white font-black tracking-[0.2em] uppercase text-sm animate-pulse">{status || "Preparing pipeline..."}</p>
                       {processing && (
                         <div className="space-y-2">
                           <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden p-0.5"><div className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full" style={{ width: `${progress}%` }} /></div>
                         </div>
                       )}
                    </div>
                 </div>
               )}
            </div>

            <div className="p-4 rounded-[2rem] bg-zinc-900/60 border border-white/10 backdrop-blur-md flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-6 flex-1 min-w-[300px]">
                  <button onClick={togglePlay} className="h-12 w-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform flex-shrink-0">{isPlaying ? <Pause className="h-5 w-5 fill-black" /> : <Play className="h-5 w-5 fill-black ml-1" />}</button>
                  <div className="flex-1 space-y-2">
                    <input type="range" min={0} max={duration || 100} step={0.1} value={currentTime} onChange={(e) => seek(parseFloat(e.target.value))} className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                    <div className="flex justify-between text-[10px] font-black text-zinc-500 tracking-widest uppercase">
                       <span>{Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}</span>
                       <span>{Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                     <button onClick={() => stepFrame(-1)} className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"><ChevronLeft className="h-4 w-4" /></button>
                     <button onClick={() => stepFrame(1)} className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
                {outputVideo && <button onMouseDown={() => setShowOriginal(true)} onMouseUp={() => setShowOriginal(false)} className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl"><Eye className="h-4 w-4" />Hold to View Original</button>}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-[2.5rem] bg-zinc-900/40 border border-white/5 backdrop-blur-xl space-y-6 shadow-2xl ring-1 ring-white/5">
               <div className="flex items-center justify-between"><h4 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Removal Layers</h4><span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">{masks.length} active</span></div>
               <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {masks.length === 0 ? (
                    <div className="py-10 text-center space-y-3 opacity-40"><MousePointer2 className="h-8 w-8 text-zinc-500 mx-auto" /><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">Draw on the video <br/> to set removal masks</p></div>
                  ) : masks.map((m, i) => (
                      <div key={m.id} onClick={() => setActiveMask(m.id)} className={cn("p-4 rounded-2xl border transition-all cursor-pointer group", activeMask === m.id ? "bg-indigo-600 border-indigo-500 shadow-xl" : "bg-black/40 border-white/5 hover:border-white/20")}>
                         <div className="flex items-center justify-between mb-2">
                            <span className={cn("text-[10px] font-black uppercase tracking-widest", activeMask === m.id ? "text-white" : "text-zinc-500")}>Layer #{i + 1}</span>
                            <button onClick={(e) => { e.stopPropagation(); deleteMask(m.id); }} className={cn("p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity", activeMask === m.id ? "text-white/60 hover:text-white" : "text-zinc-600 hover:text-rose-500")}><Trash2 className="h-3.5 w-3.5" /></button>
                         </div>
                         <div className="flex items-center gap-2"><Clock className={cn("h-3 w-3", activeMask === m.id ? "text-white/60" : "text-indigo-400")} /><span className={cn("text-[10px] font-bold", activeMask === m.id ? "text-white" : "text-zinc-400")}>00:00 - {Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}</span></div>
                      </div>
                    ))
                  }
               </div>
               <div className="space-y-3 pt-4 border-t border-white/5">
                  <button disabled={isDetecting || processing || !!outputVideo} onClick={autoDetectText} className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/5"><Sparkles className="h-3.5 w-3.5 text-indigo-400" />Auto-Detect All Text</button>
                  {!outputVideo ? (
                    <button disabled={processing || masks.length === 0} onClick={processVideo} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 text-white rounded-[1.5rem] font-black tracking-widest uppercase text-xs transition-all flex items-center justify-center gap-2 shadow-2xl shadow-indigo-600/30">{processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}Process HQ Video</button>
                  ) : (
                    <div className="space-y-3">
                      <a href={outputVideo} download="cleaned_video_hq.mp4" className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.5rem] font-black tracking-widest uppercase text-xs transition-all flex items-center justify-center gap-2 shadow-2xl shadow-emerald-500/40 no-underline"><Download className="h-5 w-5" />Download Cleaned</a>
                      <button onClick={() => { setFile(null); setOutputVideo(null); setMasks([]); }} className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"><Trash2 className="h-3.5 w-3.5 mx-auto" /></button>
                    </div>
                  )}
               </div>
            </div>
            <div className="p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 flex items-start gap-3 ring-1 ring-amber-500/5">
               <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" /><p className="text-[10px] text-amber-200/60 leading-relaxed font-medium italic">HQ processing takes 30-90s. Keep this tab active to prevent browser suspension.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
