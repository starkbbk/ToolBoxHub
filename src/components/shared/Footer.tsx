import React from 'react';
import Link from 'next/link';
import { Box, Zap } from 'lucide-react';

const footerLinks = [
  {
    title: "Products",
    links: [
      { label: "Home", href: "/" },
      { label: "God Mode", href: "/pricing" },
      { label: "Pro Plan", href: "/pricing" },
      { label: "Business Plan", href: "/pricing" },
      { label: "Enterprise Plan", href: "/pricing" },
      { label: "Pricing", href: "/pricing" },
      { label: "Log In", href: "/login" },
    ]
  },
  {
    title: "Tools",
    links: [
      { label: "Audio Transcriber", href: "/audio-transcriber" },
      { label: "ClipMaster", href: "/clipmaster" },
      { label: "Image Compressor", href: "/image-compressor" },
      { label: "PDF Converter", href: "/pdf-converter" },
      { label: "Text Remover", href: "/text-remover" },
      { label: "Text Summarizer", href: "/text-summarizer" },
    ]
  },
  {
    title: "Solutions",
    links: [
      { label: "AI Image Processing", href: "#" },
      { label: "Video Automation", href: "#" },
      { label: "OCR & Text Extraction", href: "#" },
      { label: "Audio to Text", href: "#" },
      { label: "Developer API", href: "#" },
    ]
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "#" },
      { label: "API Docs", href: "#" },
      { label: "Support Center", href: "#" },
      { label: "Status", href: "#" },
      { label: "Community", href: "#" },
      { label: "Tutorials", href: "#" },
    ]
  },
  {
    title: "Terms and policies",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Usage Policy", href: "#" },
      { label: "Cookie Policy", href: "#" },
      { label: "Security", href: "#" },
    ]
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ]
  }
];

export default function Footer() {
  return (
    <footer className="w-full bg-secondary/30 pt-24 pb-16 text-muted-foreground border-t border-border">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
          
          {/* Brand Section */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                <Box className="h-6 w-6" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-foreground">ToolboxHub</span>
            </Link>
          </div>

          {/* Links Grid */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-12 lg:gap-8">
            {footerLinks.map((section, idx) => (
              <div key={idx} className="flex flex-col gap-6">
                <h3 className="text-sm font-bold text-foreground tracking-wide uppercase opacity-90">{section.title}</h3>
                <ul className="flex flex-col gap-3">
                  {section.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <Link 
                        href={link.href}
                        className="text-sm font-medium hover:text-foreground transition-colors duration-200"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-24 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-widest opacity-60">
          <p>© {new Date().getFullYear()} ToolboxHub. All rights reserved.</p>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-foreground transition-colors">Twitter</Link>
            <Link href="#" className="hover:text-foreground transition-colors">GitHub</Link>
            <Link href="#" className="hover:text-foreground transition-colors">LinkedIn</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

