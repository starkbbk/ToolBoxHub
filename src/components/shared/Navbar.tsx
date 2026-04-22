"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/constants";
import { Menu, X, User, CreditCard, LogOut, Sun, Moon, ShieldCheck } from "lucide-react";
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
    { label: "Subscription", href: "/pricing", icon: CreditCard },
  ];

  return (
    <nav className="fixed top-0 z-50 w-full glass-navbar">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-2 group transition-transform active:scale-95">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 group-hover:rotate-6 transition-transform">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-xl font-black text-transparent tracking-tighter">
              {APP_NAME}
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em] transition-all relative py-2",
                  pathname === link.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.name}
                {pathname === link.href && (
                  <motion.div 
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                  />
                )}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Switcher */}
          <div className="hidden sm:flex items-center p-1 rounded-2xl bg-secondary/50 border border-border/50 backdrop-blur-md">
            <button
              onClick={() => setTheme('light')}
              className={cn(
                "p-2 rounded-xl transition-all duration-300",
                theme === 'light' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sun className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={cn(
                "p-2 rounded-xl transition-all duration-300",
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
                  className="flex items-center gap-3 p-1.5 pl-4 pr-1.5 rounded-2xl bg-background/50 border border-border/50 hover:bg-secondary/80 transition-all group shadow-sm backdrop-blur-md"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors hidden sm:block">
                    {user?.name ? user.name.split(' ')[0] : 'User'}
                  </span>
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold border-2 border-background shadow-lg overflow-hidden shrink-0">
                    {user?.profile_picture ? (
                      <img src={user.profile_picture} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-white">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </span>
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-0" onClick={() => setIsDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-14 w-56 rounded-2xl bg-card border border-border shadow-2xl p-2 z-10"
                      >
                        <div className="px-4 py-3 mb-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Signed in as</p>
                          <p className="text-sm font-bold text-foreground truncate">{user?.email}</p>
                        </div>
                        <div className="h-px bg-border/50 mb-2" />
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
                        <div className="h-px bg-border/50 my-2" />
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
              <Link href="/login" className="hidden md:flex items-center justify-center rounded-2xl bg-primary text-primary-foreground px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/20">
                Sign In
              </Link>
            )
          )}
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-3 rounded-2xl bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors shadow-sm"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden absolute top-20 left-0 w-full bg-background/95 backdrop-blur-2xl border-b border-border shadow-2xl overflow-hidden"
          >
            <div className="p-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "block p-5 rounded-2xl border font-black uppercase tracking-[0.2em] text-xs transition-all",
                    pathname === link.href 
                      ? "bg-primary/10 border-primary/20 text-primary shadow-inner" 
                      : "bg-secondary/30 border-border/50 text-muted-foreground"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              
              {!isAuthenticated && (
                <Link 
                  href="/login"
                  className="block text-center w-full py-5 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                >
                  Sign In
                </Link>
              )}
              
              {/* Mobile Theme Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/50 border border-border/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Appearance</span>
                <div className="flex gap-2">
                  <button onClick={() => setTheme('light')} className={cn("p-2 rounded-lg", theme === 'light' ? "bg-background shadow-sm" : "")}><Sun className="h-4 w-4" /></button>
                  <button onClick={() => setTheme('dark')} className={cn("p-2 rounded-lg", theme === 'dark' ? "bg-background shadow-sm" : "")}><Moon className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

