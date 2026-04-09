"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useRef, useState, ComponentType, useCallback } from "react";

interface ToolCardProps {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<any>;
  route: string;
  status: string;
  index: number;
}

export default function ToolCard({ name, description, icon: Icon, route, status, index }: ToolCardProps) {
  const isActive = status === "active";
  const cardRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Physics states
  const [transform, setTransform] = useState({ x: 0, y: 0, tiltX: 0, tiltY: 0 });
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), index * 100);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [index]);

  const updatePosition = useCallback((e: MouseEvent) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Proximity/Magnetic calculation
    const distThreshold = 400;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < distThreshold) {
      // Magnetic magnetism (3-5px drift toward cursor)
      const magnetism = (1 - distance / distThreshold) * 5;
      const magX = (dx / distance) * magnetism;
      const magY = (dy / distance) * magnetism;

      // Card-internal calculations
      const isInside = e.clientX >= rect.left && e.clientX <= rect.right && 
                       e.clientY >= rect.top && e.clientY <= rect.bottom;

      if (isInside) {
        // Spotlight (%)
        const spotX = ((e.clientX - rect.left) / rect.width) * 100;
        const spotY = ((e.clientY - rect.top) / rect.height) * 100;
        
        // 3D Tilt
        const tiltIntensity = 8;
        const tiltX = ((e.clientY - rect.top) / rect.height - 0.5) * -tiltIntensity;
        const tiltY = ((e.clientX - rect.left) / rect.width - 0.5) * tiltIntensity;

        setTransform({ x: magX, y: magY, tiltX, tiltY });
        setSpotlight({ x: spotX, y: spotY });
      } else {
        setTransform({ x: magX, y: magY, tiltX: 0, tiltY: 0 });
      }
    } else {
      setTransform({ x: 0, y: 0, tiltX: 0, tiltY: 0 });
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(() => updatePosition(e));
  }, [updatePosition]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [handleMouseMove]);

  const CardContent = (
    <div 
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        transform: `perspective(1000px) translate3d(${transform.x}px, ${transform.y}px, 0) rotateX(${transform.tiltX}deg) rotateY(${transform.tiltY}deg) scale(${isHovered ? 1.03 : 1})`,
        transition: !isHovered ? 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'transform 0.1s ease-out',
        cursor: isActive ? 'pointer' : 'default'
      } as any}
      className={cn(
        "group relative flex flex-col items-center p-5 text-center glass-card border-beam shine-sweep",
        !isVisible ? "reveal-hidden" : "reveal-visible",
        !isActive && "opacity-60 cursor-not-allowed grayscale"
      )}
    >
      {/* Dynamic Spotlight Layer */}
      {isHovered && (
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{ 
            background: `radial-gradient(circle 200px at ${spotlight.x}% ${spotlight.y}%, var(--primary), transparent 80%)`,
            opacity: 0.1
          }}
        />
      )}

      <div className="mb-3 relative p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]">
        <Icon className={cn(
          "h-6 w-6 transition-all duration-500",
          isHovered && "animate-pulse scale-110"
        )} />
      </div>
      
      <h3 className={cn(
        "mb-3 text-lg font-bold text-foreground tracking-tight transition-all duration-300",
        isHovered && "text-primary drop-shadow-[0_0_8px_rgba(99,102,241,0.2)]"
      )}>
        {name}
      </h3>
      
      <div className="flex items-center gap-2 relative z-10">
        {isActive ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-green-500 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/10">
            <span className={cn(
              "h-1.5 w-1.5 rounded-full bg-green-500",
              isHovered ? "animate-ping" : "animate-pulse"
            )} />
            Active
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground px-3 py-1 rounded-full bg-secondary border border-border">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            Coming Soon
          </span>
        )}
      </div>

      {isActive && (
        <div className="mt-4 flex items-center text-sm font-bold text-primary transition-all duration-300 transform group-hover:translate-x-2">
          Open Tool <span className="ml-1">→</span>
        </div>
      )}
    </div>
  );

  return isActive ? (
    <Link href={route} className="block no-underline">{CardContent}</Link>
  ) : (
    <div className="block">{CardContent}</div>
  );
}
