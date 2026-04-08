"use client";

import { useState } from "react";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import { 
  Stamp, 
  Download, 
  Loader2, 
  X,
  Type,
  ImageIcon,
  Settings2,
  Maximize,
  ArrowRight,
  Plus
} from "lucide-react";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import PDFDropzone from "./PDFDropzone";
import { cn } from "@/lib/utils";

type WatermarkType = "text" | "image";

export default function PDFWatermark() {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<WatermarkType>("text");
  const [text, setText] = useState("CONFIDENTIAL");
  const [image, setImage] = useState<File | null>(null);
  
  const [opacity, setOpacity] = useState(0.3);
  const [rotation, setRotation] = useState(-45);
  const [fontSize, setFontSize] = useState(60);
  const [color, setColor] = useState("#ff0000");

  const [processing, setProcessing] = useState(false);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return { r, g, b };
  };

  const handleApplyWatermark = async () => {
    if (!file) return;
    if (type === "image" && !image) {
      toast.error("Please select a watermark image");
      return;
    }

    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      
      const { r, g, b } = hexToRgb(color);

      if (type === "text") {
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        pages.forEach(page => {
          const { width, height } = page.getSize();
          page.drawText(text, {
            x: width / 2 - (font.widthOfTextAtSize(text, fontSize) / 2),
            y: height / 2,
            size: fontSize,
            font,
            color: rgb(r, g, b),
            opacity,
            rotate: degrees(rotation),
          });
        });
      } else if (image) {
        const imageBuffer = await image.arrayBuffer();
        let embeddedImage;
        if (image.type === "image/png") embeddedImage = await pdfDoc.embedPng(imageBuffer);
        else embeddedImage = await pdfDoc.embedJpg(imageBuffer);

        pages.forEach(page => {
          const { width, height } = page.getSize();
          const imgDims = embeddedImage.scale(0.5); // Adjust scale logic as needed
          page.drawImage(embeddedImage, {
            x: width / 2 - imgDims.width / 2,
            y: height / 2 - imgDims.height / 2,
            width: imgDims.width,
            height: imgDims.height,
            opacity,
            rotate: degrees(rotation),
          });
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      saveAs(blob, `watermarked_${file.name}`);
      toast.success("Watermark applied successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to apply watermark");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!file ? (
        <PDFDropzone onFilesSelected={handleFileSelected} multiple={false} label="Select a PDF to watermark" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-8 rounded-3xl border border-white/5 bg-zinc-900/40 space-y-8 scale-in duration-500">
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-400 mb-6 uppercase tracking-widest">
                <Settings2 className="h-4 w-4" />
                Watermark Options
              </div>

              {/* Type Toggle */}
              <div className="flex p-1 bg-zinc-950 border border-white/5 rounded-2xl">
                 <button 
                  onClick={() => setType("text")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all",
                    type === "text" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" : "text-zinc-500 hover:text-white"
                  )}
                 >
                   <Type className="h-3 w-3" /> Text
                 </button>
                 <button 
                  onClick={() => setType("image")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all",
                    type === "image" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" : "text-zinc-500 hover:text-white"
                  )}
                 >
                   <ImageIcon className="h-3 w-3" /> Image
                 </button>
              </div>

              {/* Specific Options */}
              {type === "text" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Watermark Text</label>
                    <input 
                      type="text" 
                      value={text} 
                      onChange={(e) => setText(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Text Color</label>
                    <div className="flex gap-2">
                       <input 
                        type="color" 
                        value={color} 
                        onChange={(e) => setColor(e.target.value)}
                        className="h-10 w-10 p-0 rounded-lg bg-zinc-950 border-white/10 overflow-hidden cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={color} 
                        onChange={(e) => setColor(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Watermark Image</label>
                  <div className="relative group border-2 border-dashed border-white/5 bg-zinc-950 rounded-2xl p-6 text-center cursor-pointer hover:border-indigo-500/40 transition-all">
                     <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                     />
                     {image ? (
                       <div className="space-y-2">
                          <p className="text-xs text-white font-medium truncate">{image.name}</p>
                          <p className="text-[10px] text-zinc-600">Click to change</p>
                       </div>
                     ) : (
                       <div className="space-y-2">
                          <Plus className="h-6 w-6 text-zinc-700 mx-auto" />
                          <p className="text-[10px] text-zinc-600">Select PNG or JPG</p>
                       </div>
                     )}
                  </div>
                </div>
              )}

              {/* Shared Options */}
              <div className="space-y-6">
                 <div className="space-y-3">
                   <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                     <span>Opacity</span>
                     <span className="text-indigo-400">{Math.round(opacity * 100)}%</span>
                   </div>
                   <input 
                    type="range" min="0" max="1" step="0.05" value={opacity} 
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 bg-zinc-950 h-1.5 rounded-full appearance-none cursor-pointer"
                   />
                 </div>
                 
                 <div className="space-y-3">
                   <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                     <span>Rotation</span>
                     <span className="text-indigo-400">{rotation}°</span>
                   </div>
                   <input 
                    type="range" min="-180" max="180" step="5" value={rotation} 
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 bg-zinc-950 h-1.5 rounded-full appearance-none cursor-pointer"
                   />
                 </div>

                 {type === "text" && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                        <span>Font Size</span>
                        <span className="text-indigo-400">{fontSize}px</span>
                      </div>
                      <input 
                        type="range" min="10" max="200" step="1" value={fontSize} 
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className="w-full accent-indigo-500 bg-zinc-950 h-1.5 rounded-full appearance-none cursor-pointer"
                      />
                    </div>
                 )}
              </div>

              <button
                onClick={handleApplyWatermark}
                disabled={processing}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:scale-[1.02] active:scale-[0.98]"
              >
                {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Stamp className="h-5 w-5" />}
                Apply to All Pages
              </button>
            </div>
          </div>

          {/* Visualization Area */}
          <div className="lg:col-span-2 space-y-6">
             <div className="flex items-center gap-4 p-6 rounded-3xl border border-white/5 bg-zinc-950/50 backdrop-blur-xl">
               <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                 <Stamp className="h-6 w-6" />
               </div>
               <div className="flex-1">
                 <h3 className="font-bold text-white mb-0.5">Watermark Preview</h3>
                 <p className="text-xs text-zinc-500">Real-time visualization of your settings</p>
               </div>
               <button onClick={() => setFile(null)} className="p-2.5 text-zinc-500 hover:text-white transition-all">
                  <X className="h-5 w-5" />
               </button>
             </div>

             <div className="relative aspect-[3/4] bg-zinc-950 rounded-[40px] border border-white/5 overflow-hidden flex items-center justify-center p-12">
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                   {file && <div className="p-8 space-y-4">
                      <div className="h-4 w-1/2 bg-zinc-800 rounded animate-pulse" />
                      <div className="h-4 w-full bg-zinc-800 rounded animate-pulse" />
                      <div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse" />
                      <div className="h-64 w-full bg-zinc-900/50 rounded-2xl mt-8" />
                   </div>}
                </div>

                <div className="relative z-10 transition-all duration-300" 
                     style={{ 
                       transform: `rotate(${rotation}deg)`, 
                       opacity: opacity,
                       color: type === "text" ? color : 'transparent'
                     }}>
                   {type === "text" ? (
                     <span className="font-black whitespace-nowrap select-none" style={{ fontSize: `${fontSize}px` }}>
                       {text}
                     </span>
                   ) : (
                     image ? (
                        <img 
                          src={URL.createObjectURL(image)} 
                          alt="Watermark preview" 
                          className="max-w-[300px] h-auto pointer-events-none"
                        />
                     ) : (
                        <div className="p-12 border-4 border-dashed border-white/10 rounded-full">
                           <ImageIcon className="h-20 w-20 text-white/10" />
                        </div>
                     )
                   )}
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-zinc-700 uppercase tracking-widest border border-white/5 px-4 py-2 rounded-full backdrop-blur-md">
                   Mockup Page View
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
