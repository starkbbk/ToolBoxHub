"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LiquidGlassIconProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export default function LiquidGlassIcon({ children, className, glowColor = "rgba(99, 102, 241, 0.4)" }: LiquidGlassIconProps) {
  return (
    <div className={cn(
      "relative group animate-float",
      className
    )}>
      {/* Outer Glow — High Intensity on Hover */}
      <div 
        className="absolute -inset-4 rounded-[2.5rem] opacity-30 blur-2xl transition-all duration-700 group-hover:opacity-70 group-hover:blur-3xl"
        style={{ backgroundColor: glowColor }}
      />
      
      {/* Main Glass Container with Hyper-Realistic Effects */}
      <div className="relative flex h-24 w-24 items-center justify-center rounded-[1.8rem] transition-all duration-500 overflow-hidden">
        {/* Dynamic Inner Background Gradient */}
        <div className="absolute inset-0 bg-[#0a0a0c] bg-opacity-40 backdrop-blur-3xl" />
        
        {/* Deep Internal Shadow (3D Effect) */}
        <div className="absolute inset-0 shadow-[inset_0_-8px_16px_rgba(0,0,0,0.6),inset_0_8px_16px_rgba(255,255,255,0.05)] rounded-[1.8rem]" />

        {/* Surface Shine (Floating Sweep) */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-40 group-hover:from-white/30 transition-all duration-500" />
        
        {/* Rim Lighting (Top & Left Highlights) */}
        <div className="absolute inset-0 rounded-[1.8rem] border-[1.5px] border-white/10 border-t-white/40 border-l-white/30 pointer-events-none" />

        {/* Icon Content */}
        <div className="relative z-10 text-white transition-all duration-500 group-hover:scale-125 group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
          {children}
        </div>

        {/* Bottom Internal Reflection */}
        <div className="absolute bottom-0 h-1/2 w-full bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
        
        {/* Mouse Polish Highlight (Static for now, but gives depth) */}
        <div className="absolute -top-[50%] -left-[50%] h-[200%] w-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_50%)] pointer-events-none transition-transform duration-700 group-hover:translate-x-[10%] group-hover:translate-y-[10%]" />
      </div>
    </div>
  );
}
