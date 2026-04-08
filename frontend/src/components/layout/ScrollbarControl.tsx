"use client";

import { useEffect, useRef } from "react";

export default function ScrollbarControl() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTop = useRef(0);
  const lastScrollTime = useRef(Date.now());

  useEffect(() => {
    const handleScroll = () => {
      const html = document.documentElement;
      const now = Date.now();
      const scrollTop = window.scrollY || html.scrollTop;
      
      // Calculate scroll speed
      const dt = now - lastScrollTime.current;
      const dy = Math.abs(scrollTop - lastScrollTop.current);
      const speed = dt > 0 ? (dy / dt) : 0;
      
      // Update variables
      lastScrollTop.current = scrollTop;
      lastScrollTime.current = now;

      // Add active class
      html.classList.add("scrolling-active");
      
      // map speed to a glow intensity (0 to 1 range, capped)
      const intensity = Math.min(speed * 0.5, 1.5);
      html.style.setProperty("--scroll-intensity", intensity.toString());

      // Reset timeout to remove class
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        html.classList.remove("scrolling-active");
        html.style.setProperty("--scroll-intensity", "0");
      }, 500);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return null;
}
