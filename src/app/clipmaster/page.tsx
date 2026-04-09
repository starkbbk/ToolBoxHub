"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import UploadZone from "@/components/clipmaster/UploadZone";
import URLInput from "@/components/clipmaster/URLInput";
import { clipmaster } from "@/lib/api";
import { toast } from "sonner";
import { useProjectStore } from "@/stores/useProjectStore";
import { Rocket, History } from "lucide-react";
import { cleanAnsi } from "@/lib/utils";

export default function ClipMasterPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);
  const projects = useProjectStore((state) => state.projects);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleExtract = async () => {
    if (!file && !url) {
      toast.error("Please provide a video file or YouTube URL");
      return;
    }

    setIsUploading(true);
    try {
      let projectId: number;

      if (file) {
        const response = await clipmaster.upload(file) as any;
        if (!response?.data?.project_id) throw new Error(response?.message || "Upload failed");
        projectId = response.data.project_id;
      } else {
        const response = await clipmaster.processUrl(url) as any;
        if (!response?.data?.project_id) throw new Error(response?.message || "Failed to process URL");
        projectId = response.data.project_id;
      }

      toast.success("Project created! Starting analysis...");
      await clipmaster.startProcessing(projectId);
      router.push(`/clipmaster/processing/${projectId}`);
    } catch (err: any) {
      toast.error(cleanAnsi(err.message || "Failed to start extraction"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        icon="🎬"
        title="YTClipMaster"
        description="Extract high-quality clips and highlights from your videos using AI."
      />

      <div className="space-y-12">
        {/* Step 1: Upload */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">1. Choose your video</h2>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">File or URL</span>
          </div>
          
          <UploadZone 
            selectedFile={file} 
            onFileSelect={(f) => {
              setFile(f);
              if (f) setUrl("");
            }} 
          />

          <div className="relative flex items-center justify-center py-4">
            <div className="h-px w-full bg-border" />
            <span className="absolute bg-background px-4 text-xs font-bold text-muted-foreground">OR</span>
          </div>

          <URLInput 
            value={url} 
            onChange={(val) => {
              setUrl(val);
              if (val) setFile(null);
            }} 
          />
        </section>

        {/* Action Button */}
        <button
          onClick={handleExtract}
          disabled={isUploading || (!file && !url)}
          className="group relative h-16 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 font-bold text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-indigo-500/25 active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
        >
          {isUploading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span>Initializing...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Rocket className="h-5 w-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
              <span>Extract Clips</span>
            </div>
          )}
        </button>

        {/* Recent Projects */}
        <section className="pt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-bold text-foreground">Recent Projects</h2>
            </div>
            <button 
              onClick={() => router.push('/clipmaster/history')}
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View History →
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-2xl border border-border border-dashed p-12 text-center bg-card/30">
              <p className="text-muted-foreground text-sm">No projects yet. Upload a video to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.slice(0, 4).map((p) => (
                <div 
                  key={p.id}
                  onClick={() => router.push(`/clipmaster/dashboard/${p.id}`)}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:bg-secondary/50 cursor-pointer shadow-sm"
                >
                  <p className="font-bold text-foreground line-clamp-1">{p.title}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs font-medium text-muted-foreground uppercase">{p.status}</span>
                    <span className="text-xs text-muted-foreground/60">{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
