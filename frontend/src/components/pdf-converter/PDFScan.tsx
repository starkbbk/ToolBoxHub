"use client";

import { useState, useRef, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { 
  Camera, 
  Download, 
  Loader2, 
  X,
  Plus,
  Zap,
  CheckCircle2,
  Minimize2,
  Maximize,
  RotateCcw,
  Scan as ScanIcon,
  Trash2
} from "lucide-react";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function PDFScan() {
  const [captures, setCaptures] = useState<string[]>([]);
  const [isCameraStarted, setIsCameraStarted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraStarted(true);
      }
    } catch (err) {
      toast.error("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setIsCameraStarted(false);
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Simple enhancement (increase contrast)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          // Increase contrast logic
          const r = data[i], g = data[i+1], b = data[i+2];
          data[i] = Math.min(255, r * 1.1);
          data[i+1] = Math.min(255, g * 1.1);
          data[i+2] = Math.min(255, b * 1.1);
        }
        ctx.putImageData(imageData, 0, 0);

        setCaptures(prev => [...prev, canvas.toDataURL("image/jpeg", 0.9)]);
        toast.success("Page captured!");
      }
    }
  };

  const deleteCapture = (index: number) => {
    setCaptures(prev => prev.filter((_, i) => i !== index));
  };

  const generatePDF = async () => {
    if (captures.length === 0) return;
    setProcessing(true);
    try {
      const pdfDoc = await PDFDocument.create();
      for (const imgData of captures) {
        const img = await pdfDoc.embedJpg(imgData);
        const page = pdfDoc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      saveAs(blob, `scan_${new Date().getTime()}.pdf`);
      toast.success("Scan converted to PDF successfully!");
      setCaptures([]);
      stopCamera();
    } catch (error) {
      toast.error("Failed to generate PDF from scan");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-250px)]">
        
        {/* Left Column: Camera View */}
        <div className="relative group rounded-[40px] bg-zinc-950 border border-white/5 overflow-hidden flex flex-col items-center justify-center shadow-2xl">
           {!isCameraStarted ? (
             <div className="text-center space-y-6 p-12">
                <div className="h-24 w-24 rounded-[32px] bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20 shadow-[0_0_30px_rgba(79,70,229,0.1)]">
                   <Camera className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                   <h4 className="text-xl font-black text-white italic">Ready to Scan?</h4>
                   <p className="text-sm text-zinc-500 max-w-xs mx-auto">Turn your camera into a professional document scanner.</p>
                </div>
                <button
                  onClick={startCamera}
                  className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black transition-all hover:scale-105 shadow-xl shadow-indigo-500/20"
                >
                  Enable Camera Access
                </button>
             </div>
           ) : (
             <>
               <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
               />
               <div className="absolute inset-x-0 bottom-8 flex items-center justify-center gap-6">
                  <button onClick={stopCamera} className="p-4 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-all border border-white/10">
                    <X className="h-6 w-6" />
                  </button>
                  <button 
                    onClick={captureFrame}
                    className="h-20 w-20 rounded-full bg-white border-[6px] border-indigo-500/30 flex items-center justify-center active:scale-90 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                  >
                    <div className="h-12 w-12 rounded-full bg-indigo-600 animate-pulse" />
                  </button>
                  <div className="w-14" /> {/* Spacer */}
               </div>
               <div className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 bg-indigo-500 rounded-full text-white text-[10px] font-black uppercase tracking-widest shadow-xl animate-pulse">
                  <div className="h-1.5 w-1.5 rounded-full bg-white mr-1" />
                  Live Feed
               </div>
             </>
           )}
           <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Right Column: Scanned Pages List */}
        <div className="flex flex-col gap-6">
           <div className="flex items-center justify-between p-6 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                    <ScanIcon className="h-5 w-5" />
                 </div>
                 <h4 className="font-bold text-white">Scanned Pages</h4>
              </div>
              <div className="px-3 py-1 bg-zinc-950 rounded-full border border-white/5 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                 {captures.length} Total
              </div>
           </div>

           <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-4 p-1">
              {captures.length === 0 ? (
                <div className="h-full border-2 border-dashed border-white/5 rounded-[32px] flex flex-col items-center justify-center gap-4 text-zinc-600 grayscale opacity-50">
                   <div className="p-6 rounded-full border border-white/5">
                      <Plus className="h-12 w-12" />
                   </div>
                   <p className="text-xs font-bold uppercase tracking-widest">Capture a page to begin</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                   {captures.map((cap, idx) => (
                     <div key={idx} className="relative group aspect-[3/4] rounded-2xl border border-white/5 bg-zinc-950 overflow-hidden shadow-xl scale-in duration-300">
                        <img src={cap} alt={`Capture ${idx}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                           <button onClick={() => deleteCapture(idx)} className="p-3 rounded-full bg-rose-500 text-white shadow-xl hover:scale-110 transition-all">
                              <Trash2 className="h-5 w-5" />
                           </button>
                           <span className="text-[10px] font-bold text-white uppercase tracking-widest">Page {idx + 1}</span>
                        </div>
                     </div>
                   ))}
                </div>
              )}
           </div>

           <button
             disabled={captures.length === 0 || processing}
             onClick={generatePDF}
             className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 disabled:grayscale text-white rounded-[24px] font-black flex items-center justify-center gap-3 transition-all shadow-2xl shadow-emerald-500/10 hover:scale-[1.02]"
           >
             {processing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Download className="h-6 w-6" />}
             Compile & Save Scan
           </button>
        </div>
      </div>
    </div>
  );
}
