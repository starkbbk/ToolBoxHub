"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/constants";
import { Menu, X, User, Settings, CreditCard, LogOut, ChevronDown, Sparkles, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useThemeStore } from "@/stores/useThemeStore";

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const { theme, setTheme } = useThemeStore();
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
                  "text-xs font-black uppercase tracking-widest transition-all",
                  pathname === link.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Switcher Tabs */}
          <div className="hidden sm:flex items-center p-1 rounded-full bg-secondary/50 border border-border">
            <button
              onClick={() => setTheme('light')}
              className={cn(
                "p-2 rounded-full transition-all duration-300",
                theme === 'light' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sun className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={cn(
                "p-2 rounded-full transition-all duration-300",
                theme === 'dark' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Moon className="h-4 w-4" />
            </button>
          </div>

          {!isLoading && (
            isAuthenticated ? (
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-3 pr-2 rounded-full bg-background border border-border hover:bg-secondary transition-colors group shadow-sm"
                >
                   {user?.subscription_plan !== 'free' && (
                    <Sparkles className="h-3 w-3 text-amber-400 fill-amber-400" />
                  )}
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                    {user?.name ? user.name.split(' ')[0] : 'User'}
                  </span>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold border border-white/20">
                    {user?.profile_picture ? (
                      <img src={user.profile_picture} alt={user.name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", isDropdownOpen && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-0" onClick={() => setIsDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-12 w-48 rounded-2xl bg-card border border-border shadow-2xl p-2 z-10"
                      >
                        {userMenuItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors group"
                          >
                            <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                            <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground">{item.label}</span>
                          </Link>
                        ))}
                        <div className="h-px bg-border my-1 mx-2" />
                        <button
                          onClick={logout}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive/10 transition-colors group"
                        >
                          <LogOut className="h-4 w-4 text-muted-foreground group-hover:text-destructive" />
                          <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground">Logout</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login" className="hidden md:block rounded-xl bg-primary text-primary-foreground px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-primary/20">
                Sign In
              </Link>
            )
          )}
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors shadow-sm"
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
            className="md:hidden absolute top-16 left-0 w-full bg-background/95 backdrop-blur-2xl border-b border-border shadow-2xl px-4 py-8 space-y-4"
          >
            {/* Theme Switcher in Mobile */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary border border-border">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Appearance</span>
              <div className="flex items-center p-1 rounded-full bg-background border border-border">
                <button
                  onClick={() => setTheme('light')}
                  className={cn(
                    "p-2 px-4 rounded-full transition-all duration-300 flex items-center gap-2",
                    theme === 'light' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Sun className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase">Light</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={cn(
                    "p-2 px-4 rounded-full transition-all duration-300 flex items-center gap-2",
                    theme === 'dark' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Moon className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase">Dark</span>
                </button>
              </div>
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block text-lg font-black uppercase tracking-wider transition-all p-4 rounded-2xl border",
                  pathname === link.href 
                    ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {link.name}
              </Link>
            ))}
            
            {isAuthenticated ? (
              <button 
                onClick={logout}
                className="w-full py-5 bg-destructive/10 text-destructive border border-destructive/20 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-transform mt-4"
              >
                Logout
              </button>
            ) : (
              <Link 
                href="/login"
                className="block text-center w-full py-5 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-transform mt-4"
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
