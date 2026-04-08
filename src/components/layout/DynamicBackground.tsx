"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export default function DynamicBackground() {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

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

  // Generate deterministic sparkles (same on every render for stability)
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

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#020202]">
      {/* Layer 1: Animated Mesh Blobs */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/20 blur-[120px] animate-blob" style={{ animationDelay: '0s' }} />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px] animate-blob" style={{ animationDelay: '-5s' }} />
        <div className="absolute bottom-[-10%] left-[10%] w-[55%] h-[55%] rounded-full bg-blue-900/20 blur-[120px] animate-blob" style={{ animationDelay: '-10s' }} />
        <div className="absolute bottom-[20%] right-[10%] w-[45%] h-[45%] rounded-full bg-violet-900/20 blur-[120px] animate-blob" style={{ animationDelay: '-15s' }} />
      </div>

      {/* Layer 2: Sparkling Starfield with Parallax */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ transform: `translateY(${-scrollY * 0.5}px)` }}
      >
        {sparkles.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white opacity-20 animate-twinkle"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, 0.5)`,
              '--twinkle-duration': `${star.duration}s`,
              animationDelay: `${star.delay}s`,
            } as any}
          />
        ))}
      </div>

      {/* Layer 3: Interactive Spotlight */}
      <div 
        ref={spotlightRef}
        className="absolute top-0 left-0 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[10] opacity-50"
        style={{
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%)",
          mixBlendMode: "screen",
          filter: "blur(80px)",
        }}
      />
    </div>
  );
}
