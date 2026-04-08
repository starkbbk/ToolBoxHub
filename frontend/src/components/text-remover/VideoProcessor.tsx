"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Video, 
  Download, 
  Loader2, 
  Trash2, 
  Clock,
  Play,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import PDFDropzone from "../pdf-converter/PDFDropzone";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import axios from "axios";

interface VideoRegion {
  x: number;
  y: number;
  w: number;
  h: number;
  start_time: number;
  end_time: number;
}

export default function VideoProcessor() {
  const [file, setFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [regions, setRegions] = useState<VideoRegion[]>([]);
  const [outputVideo, setOutputVideo] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      if (selectedFile.size > 100 * 1024 * 1024) {
        toast.error("Video exceeds 100MB limit.");
        return;
      }
      setFile(selectedFile);
      setVideoPreview(URL.createObjectURL(selectedFile));
      setRegions([]);
      setOutputVideo(null);
    }
  };

  const addRegionAtCurrentTime = () => {
    // Default region in center
    setRegions(prev => [...prev, {
      x: 100, y: 100, w: 200, h: 50,
      start_time: 0,
      end_time: videoRef.current?.duration || 0
    }]);
  };

  const processVideo = async () => {
    if (!file || regions.length === 0) return;
    setProcessing(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("video", file);
    formData.append("regions", JSON.stringify(regions));

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/api/text-remover/video`, formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
          setProgress(Math.min(percentCompleted, 20)); // Upload is first 20%
        }
      });

      if (response.data.status === "success") {
        // Backend processing simulation (since we're running it sync in router for now)
        setProgress(100);
        setOutputVideo(`${apiUrl}${response.data.data.output_path}`);
        toast.success("Video cleaned successfully!");
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      toast.error("Video processing failed. The file might be too large or the server timed out.");
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {!file ? (
        <PDFDropzone 
          onFilesSelected={handleFileSelected} 
          multiple={false} 
          accept={{ "video/*": [".mp4", ".mov", ".avi", ".webm"] }}
          label="Drop a video here (Max 100MB)"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Preview Area */}
          <div className="lg:col-span-3 space-y-4">
            <div className="relative rounded-3xl bg-zinc-950/50 border border-white/5 overflow-hidden shadow-2xl">
               {!outputVideo ? (
                 <video 
                   ref={videoRef}
                   src={videoPreview!} 
                   className="w-full h-auto object-contain max-h-[70vh]"
                   controls
                   onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                 />
               ) : (
                 <video 
                   src={outputVideo} 
                   className="w-full h-auto object-contain max-h-[70vh]"
                   controls
                 />
               )}
               
               {/* Overlay for Bounding Boxes (Manual selection mockup) */}
               {!outputVideo && regions.length > 0 && (
                 <div className="absolute inset-0 pointer-events-none">
                    {regions.map((r, i) => (
                      <div 
                        key={i}
                        className="absolute border-2 border-dashed border-indigo-500 bg-indigo-500/10 flex items-center justify-center"
                        style={{ left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` }}
                      >
                         <span className="text-[10px] text-white font-bold bg-indigo-600 px-1 rounded">Mask {i+1}</span>
                      </div>
                    ))}
                 </div>
               )}

               {processing && (
                 <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-6 z-20">
                    <div className="relative h-24 w-24">
                       <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin" />
                       <div className="absolute inset-0 flex items-center justify-center">
                          <Video className="h-8 w-8 text-indigo-400 animate-pulse" />
                       </div>
                    </div>
                    <div className="text-center space-y-2">
                       <p className="text-white font-bold tracking-widest uppercase text-xs">PROCESSING FRAMES...</p>
                       <div className="w-64 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                       </div>
                       <p className="text-[10px] text-zinc-500">{progress}% Complete</p>
                    </div>
                 </div>
               )}
            </div>
          </div>

          {/* Sidebar Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-3xl bg-zinc-900/40 border border-white/5 space-y-6">
               <h4 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Video Masks</h4>
               
               {!outputVideo && (
                 <div className="space-y-4">
                    <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                      Move the video to the frame where text appears, then add a mask.
                    </p>
                    <button 
                      onClick={addRegionAtCurrentTime}
                      className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      Add Removal Mask
                    </button>
                    
                    <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
                       {regions.map((r, i) => (
                         <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-white/5 text-[10px] text-zinc-400">
                            <div className="flex items-center gap-2">
                               <Clock className="h-3 w-3" />
                               {r.start_time.toFixed(1)}s - {r.end_time.toFixed(1)}s
                            </div>
                            <button onClick={() => setRegions(prev => prev.filter((_, idx) => idx !== i))} className="text-rose-500 hover:text-rose-400">
                               <Trash2 className="h-3 w-3" />
                            </button>
                         </div>
                       ))}
                    </div>
                 </div>
               )}

               <div className="pt-4 border-t border-white/5">
                 {!outputVideo ? (
                   <button 
                     disabled={processing || regions.length === 0}
                     onClick={processVideo}
                     className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                   >
                     {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                     Process & Re-encode
                   </button>
                 ) : (
                   <div className="space-y-3">
                     <a 
                       href={outputVideo}
                       download="cleaned_video.mp4"
                       className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 no-underline"
                     >
                       <Download className="h-5 w-5" />
                       Download MP4
                     </a>
                     <button 
                       onClick={() => {
                         setFile(null);
                         setOutputVideo(null);
                       }}
                       className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                     >
                       <Trash2 className="h-4 w-4" />
                       Start Over
                     </button>
                   </div>
                 )}
               </div>
            </div>

            <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
               <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
               <p className="text-[10px] text-amber-300 leading-relaxed italic">
                 Video processing may take several minutes depending on length. Ensure you stay on this page.
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
