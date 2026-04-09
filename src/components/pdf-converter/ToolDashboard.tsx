"use client";

import { PDF_TOOLS, PDF_CATEGORIES, PDFTool } from "@/constants/pdf-tools";
import { motion } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface ToolDashboardProps {
  onSelectTool: (toolId: string) => void;
}

export default function ToolDashboard({ onSelectTool }: ToolDashboardProps) {
  const [search, setSearch] = useState("");

  const filteredTools = useMemo(() => {
    if (!search) return PDF_TOOLS;
    return PDF_TOOLS.filter(tool => 
      tool.label.toLowerCase().includes(search.toLowerCase()) ||
      tool.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-12 pb-32 custom-scrollbar">
      {/* Search Header */}
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <h1 className="text-4xl font-black text-foreground tracking-tight">
          Every PDF tool you'll ever need. <span className="text-primary">All in one place.</span>
        </h1>
        <div className="relative group max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="What would you like to do? (e.g. Merge, Sign, OCR...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-secondary border border-border rounded-2xl pl-12 pr-4 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium backdrop-blur-xl"
          />
        </div>
      </div>

      {/* Grid of Categories */}
      <div className="max-w-6xl mx-auto space-y-16">
        {PDF_CATEGORIES.map((category, idx) => {
          const categoryTools = filteredTools.filter(t => t.category === category.id);
          if (categoryTools.length === 0) return null;

          return (
            <div key={category.id} className="space-y-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold uppercase tracking-[0.2em] text-muted-foreground">{category.label}</h2>
                <div className="h-px bg-border flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryTools.map((tool, toolIdx) => {
                  const Icon = tool.icon;
                  return (
                    <motion.button
                      key={tool.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (idx * 0.1) + (toolIdx * 0.05) }}
                      onClick={() => onSelectTool(tool.id)}
                      className="group relative flex flex-col items-start p-6 rounded-3xl border border-border bg-card hover:bg-secondary/80 hover:border-primary/30 transition-all text-left overflow-hidden backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-primary/5"
                    >
                      {/* Hover Glow */}
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="relative z-10 p-3 rounded-2xl bg-secondary border border-border group-hover:bg-primary/10 group-hover:border-primary/20 transition-all mb-4">
                        <Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
                      </div>

                      <div className="relative z-10 flex-1 space-y-2">
                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                          {tool.label}
                          {tool.isBackend && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/20 text-primary font-bold uppercase tracking-wider">AI</span>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>

                      <div className="relative z-10 mt-4 flex items-center gap-2 text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors uppercase tracking-widest">
                        Open Tool
                        <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
