"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/constants";
import { Menu, X, User, Settings, CreditCard, LogOut, ChevronDown, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Pricing", href: "/pricing" },
    { name: "History", href: "/clipmaster/history" },
  ];

  const userMenuItems = [
    { label: "Profile", href: "/profile", icon: User },
    { label: "Subscription", href: "/profile", icon: CreditCard },
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
          {!isLoading && (
            isAuthenticated ? (
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-3 pr-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                >
                   {user?.subscription_plan !== 'free' && (
                    <Sparkles className="h-3 w-3 text-amber-400 fill-amber-400" />
                  )}
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
                    {user?.name ? user.name.split(' ')[0] : 'User'}
                  </span>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold border border-white/20">
                    {user?.profile_picture ? (
                      <img src={user.profile_picture} alt={user.name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  <ChevronDown className={cn("h-3 w-3 text-zinc-500 transition-transform", isDropdownOpen && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-0" onClick={() => setIsDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-12 w-48 rounded-2xl bg-[#0c0c0c] border border-white/10 shadow-2xl p-2 z-10"
                      >
                        {userMenuItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group"
                          >
                            <item.icon className="h-4 w-4 text-zinc-500 group-hover:text-indigo-400" />
                            <span className="text-xs font-bold text-zinc-400 group-hover:text-white">{item.label}</span>
                          </Link>
                        ))}
                        <div className="h-px bg-white/5 my-1 mx-2" />
                        <button
                          onClick={logout}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors group"
                        >
                          <LogOut className="h-4 w-4 text-zinc-500 group-hover:text-red-400" />
                          <span className="text-xs font-bold text-zinc-400 group-hover:text-white">Logout</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login" className="hidden md:block rounded-xl bg-white/5 border border-white/10 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-indigo-600 hover:border-indigo-500 shadow-xl">
                Sign In
              </Link>
            )
          )}
          
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
                  "block text-lg font-black uppercase tracking-wider transition-all p-4 rounded-2xl border",
                  pathname === link.href 
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20" 
                    : "bg-white/5 border-white/5 text-zinc-500 hover:text-white hover:bg-white/10"
                )}
              >
                {link.name}
              </Link>
            ))}
            
            {isAuthenticated ? (
              <button 
                onClick={logout}
                className="w-full py-5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-transform mt-4"
              >
                Logout
              </button>
            ) : (
              <Link 
                href="/login"
                className="block text-center w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-transform mt-4"
              >
                Sign In
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
