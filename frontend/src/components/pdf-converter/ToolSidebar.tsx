"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { PDF_TOOLS, PDF_CATEGORIES, PDFTool, ToolCategory } from "@/constants/pdf-tools";
import { cn } from "@/lib/utils";

interface ToolSidebarProps {
  activeToolId: string | null;
  onSelectTool: (toolId: string) => void;
}

export default function ToolSidebar({ activeToolId, onSelectTool }: ToolSidebarProps) {
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<ToolCategory>>(
    new Set(PDF_CATEGORIES.map(c => c.id))
  );

  const toggleCategory = (id: ToolCategory) => {
    const next = new Set(expandedCategories);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedCategories(next);
  };

  const filteredTools = useMemo(() => {
    if (!search) return PDF_TOOLS;
    return PDF_TOOLS.filter(tool => 
      tool.label.toLowerCase().includes(search.toLowerCase()) ||
      tool.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-white/5 w-72 shrink-0 overflow-hidden">
      {/* Search Bar */}
      <div className="p-4 border-b border-white/5">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
          <input
            type="text"
            placeholder="Search tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-medium"
          />
        </div>
      </div>

      {/* Tools List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
        {PDF_CATEGORIES.map(category => {
          const categoryTools = filteredTools.filter(t => t.category === category.id);
          if (categoryTools.length === 0) return null;

          const isExpanded = expandedCategories.has(category.id);

          return (
            <div key={category.id} className="space-y-1">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors"
              >
                {category.label}
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>

              {isExpanded && (
                <div className="space-y-0.5">
                  {categoryTools.map(tool => {
                    const Icon = tool.icon;
                    const isActive = activeToolId === tool.id;

                    return (
                      <button
                        key={tool.id}
                        onClick={() => onSelectTool(tool.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative",
                          isActive 
                            ? "bg-indigo-500/10 text-indigo-400" 
                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                        )}
                      >
                        {isActive && (
                          <div className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full" />
                        )}
                        <Icon className={cn(
                          "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                          isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"
                        )} />
                        <div className="flex flex-col items-start overflow-hidden">
                          <span className="text-sm font-semibold truncate w-full">{tool.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
