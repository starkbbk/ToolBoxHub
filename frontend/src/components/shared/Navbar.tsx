"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/constants";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "ClipMaster", href: "/clipmaster" },
    { name: "History", href: "/clipmaster/history" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#2a2a2a] bg-[#0a0a0a]/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-xl font-bold text-transparent">
              {APP_NAME}
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-white",
                  pathname === link.href ? "text-white" : "text-zinc-400"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800">
            Sign In
          </button>
        </div>
      </div>
    </nav>
  );
}
