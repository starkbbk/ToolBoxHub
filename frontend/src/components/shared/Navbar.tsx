"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/constants";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "YTClipMaster", href: "/clipmaster" },
    { name: "History", href: "/clipmaster/history" },
  ];

  return (
    <nav className="fixed top-0 z-50 w-full glass-navbar">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 relative group">
            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-xl font-black text-transparent tracking-tighter hover:scale-105 transition-transform">
              {APP_NAME}
            </span>
            <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 group-hover:w-full transition-all duration-300" />
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-xs font-black uppercase tracking-widest transition-all hover:text-indigo-400",
                  pathname === link.href ? "text-indigo-400" : "text-zinc-500"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="hidden md:block rounded-xl bg-white/5 border border-white/10 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-indigo-600 hover:border-indigo-500 shadow-xl">
            Sign In
          </button>
          
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-16 left-0 w-full bg-zinc-950/95 backdrop-blur-2xl border-b border-white/10 shadow-2xl px-4 py-8 space-y-4"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block text-lg font-black uppercase tracking-[0.2em] transition-all p-4 rounded-2xl border",
                  pathname === link.href 
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20" 
                    : "bg-white/5 border-white/5 text-zinc-500 hover:text-white hover:bg-white/10"
                )}
              >
                {link.name}
              </Link>
            ))}
            <button className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-transform mt-4">
              Sign In
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
