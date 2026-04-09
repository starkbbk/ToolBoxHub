"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/stores/useProjectStore";
import PageHeader from "@/components/shared/PageHeader";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { motion, AnimatePresence } from "framer-motion";
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
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = () => {
    if (projectToDelete !== null) {
      deleteProject(projectToDelete);
      setProjectToDelete(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <PageHeader
          icon="📂"
          title="Project History"
          description="Access and manage all your past video processing projects."
        />
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-secondary border border-border rounded-2xl py-3 pl-12 pr-4 text-sm text-foreground focus:border-primary/50 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {loading && projects.length === 0 ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[40vh] rounded-3xl border-2 border-dashed border-border p-12 text-center bg-card/50">
          <p className="text-muted-foreground text-lg mb-4">No projects found.</p>
          <button 
             onClick={() => router.push('/clipmaster')}
             className="px-6 py-2.5 rounded-xl bg-primary text-sm font-bold text-primary-foreground hover:scale-105 transition-all shadow-lg shadow-primary/20"
          >
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => (
              <motion.div 
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.5, 
                  filter: "blur(20px)",
                  transition: { duration: 0.5, ease: "backIn" }
                }}
                className="group relative flex flex-col rounded-3xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:bg-secondary/50 hover:shadow-xl shadow-sm"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-secondary p-3 text-primary group-hover:scale-110 transition-transform shadow-inner">
                      {project.source_type === "youtube" ? <Play className="h-6 w-6" /> : <FileVideo className="h-6 w-6" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground line-clamp-1 pr-4">{project.title}</h3>
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
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {Math.round(project.duration_seconds || 0)}s Duration
                  </div>
                </div>

                <div className="mt-auto flex items-center gap-3">
                  <button 
                    onClick={() => router.push(`/clipmaster/dashboard/${project.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-bold transition-all hover:opacity-90 shadow-md shadow-primary/10"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Dashboard
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setProjectToDelete(project.id);
                    }}
                    className="rounded-xl border border-border bg-secondary p-3 text-muted-foreground transition-all hover:text-destructive hover:bg-destructive/5 hover:border-destructive/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ConfirmModal
        isOpen={projectToDelete !== null}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone and all associated files will be permanently removed."
        confirmText="Yes, Delete"
        cancelText="Keep Project"
      />
    </div>
  );
}
