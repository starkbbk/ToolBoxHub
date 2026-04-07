"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/stores/useProjectStore";
import PageHeader from "@/components/shared/PageHeader";
import { 
  FileVideo, 
  Play, 
  Trash2, 
  ExternalLink,
  Search,
  Calendar,
  Clock as ClockIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
  const router = useRouter();
  const { projects, fetchProjects, deleteProject, loading } = useProjectStore();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <PageHeader
          icon="📂"
          title="Project History"
          description="Access and manage all your past video processing projects."
        />
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:border-indigo-500/50 outline-none transition-all"
          />
        </div>
      </div>

      {loading && projects.length === 0 ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[40vh] rounded-3xl border-2 border-dashed border-[#2a2a2a] p-12 text-center">
          <p className="text-zinc-500 text-lg mb-4">No projects found.</p>
          <button 
             onClick={() => router.push('/clipmaster')}
             className="px-6 py-2.5 rounded-xl bg-indigo-500 text-sm font-bold text-white hover:bg-indigo-600 transition-colors"
          >
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map((project) => (
            <div 
              key={project.id}
              className="group relative flex flex-col rounded-3xl border border-[#2a2a2a] bg-[#1a1a1a] p-6 transition-all hover:border-[#3a3a3a] hover:bg-[#202020] hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-zinc-900 p-3 text-indigo-400 group-hover:scale-110 transition-transform">
                    {project.source_type === "youtube" ? <Play className="h-6 w-6" /> : <FileVideo className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-white line-clamp-1 pr-4">{project.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md",
                        project.status === "completed" ? "bg-green-500/10 text-green-500" : 
                        project.status === "failed" ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"
                      )}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(project.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <ClockIcon className="h-3.5 w-3.5" />
                  {Math.round(project.duration_seconds || 0)}s Duration
                </div>
              </div>

              <div className="mt-auto flex items-center gap-3">
                <button 
                  onClick={() => router.push(`/clipmaster/dashboard/${project.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-[#2a2a2a] py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800 hover:border-zinc-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Dashboard
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Are you sure? This will delete all project data and files.")) {
                      deleteProject(project.id);
                    }
                  }}
                  className="rounded-xl border border-[#2a2a2a] bg-zinc-900 p-3 text-zinc-500 transition-all hover:text-red-500 hover:bg-red-500/5 hover:border-red-500/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
