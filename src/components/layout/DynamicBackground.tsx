"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

import { useThemeStore } from "@/stores/useThemeStore";

export default function DynamicBackground() {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const { theme } = useThemeStore();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (spotlightRef.current) {
        const { clientX, clientY } = e;
        spotlightRef.current.style.transform = `translate(${clientX}px, ${clientY}px)`;
      }
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Generate deterministic sparkles
  const sparkles = React.useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 5,
    }));
  }, []);

  const isDark = theme === "dark";

  return (
    <div className={cn(
      "fixed inset-0 z-[-1] overflow-hidden transition-colors duration-700",
      "bg-background"
    )}>
      {/* Mesh Background for Light Mode */}
      <div className="bg-mesh opacity-100" />
      
      {/* Layer 1: Animated Mesh Blobs (Enhanced) */}
      <div className={cn("absolute inset-0 transition-opacity duration-1000", isDark ? "opacity-30" : "opacity-40")}>
        <div className={cn(
          "absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] animate-blob",
          isDark ? "bg-indigo-900/40" : "bg-indigo-400/20"
        )} style={{ animationDelay: '0s' }} />
        <div className={cn(
          "absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] animate-blob",
          isDark ? "bg-purple-900/30" : "bg-rose-300/20"
        )} style={{ animationDelay: '-5s' }} />
        <div className={cn(
          "absolute bottom-[-10%] left-[10%] w-[55%] h-[55%] rounded-full blur-[120px] animate-blob",
          isDark ? "bg-blue-900/30" : "bg-violet-300/20"
        )} style={{ animationDelay: '-10s' }} />
      </div>

      {/* Layer 2: Sparkling Starfield (Subtle) */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ transform: `translateY(${-scrollY * 0.2}px)` }}
      >
        {sparkles.map((star) => (
          <div
            key={star.id}
            className={cn(
              "absolute rounded-full animate-twinkle transition-colors duration-500",
              isDark ? "bg-white opacity-20" : "bg-primary opacity-10"
            )}
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              boxShadow: isDark 
                ? `0 0 ${star.size * 2}px rgba(255, 255, 255, 0.3)`
                : `0 0 ${star.size * 2}px var(--primary)`,
              '--twinkle-duration': `${star.duration}s`,
              animationDelay: `${star.delay}s`,
            } as any}
          />
        ))}
      </div>

      {/* Layer 3: Interactive Spotlight (Very Subtle) */}
      <div 
        ref={spotlightRef}
        className={cn(
          "absolute top-0 left-0 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[10] transition-opacity duration-1000",
          isDark ? "opacity-40" : "opacity-20"
        )}
        style={{
          background: isDark 
            ? "radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0) 70%)"
            : "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />
    </div>
  );
}
