"use client";

import React, { useEffect, useState } from "react";
import ToolCard from "@/components/shared/ToolCard";
import { TOOLS } from "@/constants/tools";

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <section 
        className="mb-12 text-center relative will-change-transform"
        style={{ transform: `translateY(${scrollY * 0.2}px)` }}
      >
        <h1 className="mb-6 text-6xl font-extrabold tracking-tighter sm:text-8xl">
          <span className="bg-gradient-to-r from-indigo-400 via-purple-500 to-indigo-400 bg-clip-text text-transparent animate-gradient-text drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            ToolboxHub
          </span>
        </h1>
        <p className="max-w-xl mx-auto text-muted-foreground text-lg sm:text-xl font-medium tracking-tight">
          Next-generation AI utility suite for digital creators.
        </p>
        
        {/* Subtle Animated Background Accent */}
        <div className="absolute top-[-20%] left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[130px]" />
      </section>

      {/* Tools Grid */}
      <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool, index) => (
          <ToolCard
            key={tool.id}
            index={index}
            {...tool}
          />
        ))}
      </div>
    </div>
  );
}
