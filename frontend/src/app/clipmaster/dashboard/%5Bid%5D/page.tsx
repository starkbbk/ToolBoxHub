"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProjectStore } from "@/stores/useProjectStore";
import { useClipStore } from "@/stores/useClipStore";
import { useKeyboard } from "@/hooks/useKeyboard";
import { API_URL } from "@/constants";

import VideoPlayer from "@/components/clipmaster/VideoPlayer";
import Timeline from "@/components/clipmaster/Timeline";
import ClipList from "@/components/clipmaster/ClipList";

import { 
  Search, 
  Filter, 
  Download, 
  CheckCircle, 
  RefreshCcw, 
  LayoutGrid, 
  ChevronDown,
  ArrowLeft,
  Settings2,
  Share2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);

  const { currentProject, fetchProject, loading: projectLoading } = useProjectStore();
  const { 
    clips, 
    fetchClips, 
    activeClipId, 
    setActiveClip, 
    updateClip, 
    deleteClip, 
    approveAll,
    filters,
    setFilters
  } = useClipStore();

  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [seekTo, setSeekTo] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchProject(projectId);
    fetchClips(projectId);
  }, [projectId, fetchProject, fetchClips]);

  // Keyboard Shortcuts
  useKeyboard({
    " ": () => setIsPlaying(!isPlaying),
    "arrowleft": (e) => { e.preventDefault(); setSeekTo(Math.max(0, currentTime - 5)); },
    "arrowright": (e) => { e.preventDefault(); setSeekTo(Math.min(videoDuration, currentTime + 5)); },
    "a": () => {
      const active = clips.find(c => c.id === activeClipId);
      if (active) {
        updateClip(active.id, { is_approved: true });
        toast.success("Approved via shortcut");
      }
    }
  });

  // Sync active clip with video time
  useEffect(() => {
    const active = clips.find(c => currentTime >= c.start_seconds && currentTime <= c.end_seconds);
    if (active && active.id !== activeClipId) {
      setActiveClip(active.id);
    }
  }, [currentTime, clips, activeClipId, setActiveClip]);

  const handlePlayClip = (seconds: number, id: number) => {
    setSeekTo(seconds);
    setActiveClip(id);
    // Reset seekTo after brief delay so it can be triggered again for the same clip
    setTimeout(() => setSeekTo(null), 100);
  };

  const handleExport = async (format: string) => {
    try {
      toast.info(`Preparing ${format.toUpperCase()} export...`);
      // Logic for export blob handling would go here
      window.open(`${API_URL}/api/clipmaster/export/${projectId}?format=${format}`, '_blank');
    } catch (err) {
      toast.error("Export failed");
    }
  };

  if (projectLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
      </div>
    );
  }

  const videoUrl = currentProject?.source_type === "youtube" 
    ? currentProject.source_url! 
    : `${API_URL}/api/clipmaster/video/${projectId}`;

  return (
    <div className="flex flex-col gap-8">
      {/* Top Banner / Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/clipmaster')}
            className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-2.5 text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Project Dashboard</span>
              <span className="text-zinc-600">•</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">ID: {projectId}</span>
            </div>
            <h1 className="text-2xl font-bold text-white line-clamp-1">{currentProject?.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-2.5 text-sm font-bold text-zinc-300 transition-all hover:border-[#3a3a3a] hover:bg-[#222222]">
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <button 
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="h-4 w-4" />
            Export Clips
          </button>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Player and Timeline (60%) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          <div className="rounded-3xl border border-[#2a2a2a] bg-[#0d0d0d] p-4 p-md-6">
            <VideoPlayer 
              url={videoUrl}
              onProgress={(state) => setCurrentTime(state.playedSeconds)}
              onDuration={setVideoDuration}
              seekTo={seekTo}
              isPlaying={isPlaying}
            />
            
            <div className="mt-6 px-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-zinc-500">
                  {new Date(currentTime * 1000).toISOString().substr(11, 8)} / {new Date(videoDuration * 1000).toISOString().substr(11, 8)}
                </span>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Interactive Timeline</span>
              </div>
              <Timeline 
                duration={videoDuration}
                currentTime={currentTime}
                clips={clips}
                onSeek={(sec) => setSeekTo(sec)}
              />
            </div>
          </div>

          {/* Quick Stats / Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Clips", value: clips.length },
              { label: "Approved", value: clips.filter(c => c.is_approved).length },
              { label: "Duration", value: `${Math.round(videoDuration / 60)}m` },
              { label: "Language", value: currentProject?.transcript?.language?.toUpperCase() || "EN" }
            ].map((stat, i) => (
              <div key={i} className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Controls and List (40%) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 h-full">
          
          <div className="flex flex-col gap-4 rounded-3xl border border-[#2a2a2a] bg-[#1a1a1a] p-6">
            {/* Search and Filters Header */}
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Search in clips..."
                  value={filters.search}
                  onChange={(e) => {
                    setFilters({ search: e.target.value });
                    fetchClips(projectId);
                  }}
                  className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:border-indigo-500/50 outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-zinc-500" />
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Filters</span>
                </div>
                <button 
                  onClick={() => {
                    setFilters({ category: null, search: "", minConfidence: 0 });
                    fetchClips(projectId);
                  }}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase"
                >
                  Clear All
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {["highlight", "funny", "emotional", "key_point", "topic_change"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setFilters({ category: filters.category === cat ? null : cat });
                      fetchClips(projectId);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border transition-all",
                      filters.category === cat 
                        ? "bg-indigo-500 border-indigo-400 text-white" 
                        : "bg-zinc-900 border-[#2a2a2a] text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                    )}
                  >
                    {cat.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Clips List */}
            <div className="flex-1 mt-2">
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-xs font-bold text-zinc-400">{clips.length} Suggestions</span>
                <div className="flex items-center gap-1 text-xs text-zinc-500">
                  <span>Sort by:</span>
                  <select 
                    value={filters.sortBy}
                    onChange={(e) => {
                      setFilters({ sortBy: e.target.value });
                      fetchClips(projectId);
                    }}
                    className="bg-transparent text-white font-bold outline-none cursor-pointer"
                  >
                    <option value="time">Time</option>
                    <option value="confidence">Confidence</option>
                    <option value="category">Category</option>
                  </select>
                </div>
              </div>
              
              <ClipList 
                clips={clips}
                activeClipId={activeClipId}
                onPlay={handlePlayClip}
                onEdit={(clip) => toast.info("Edit modal coming soon")}
                onApprove={(id) => {
                  updateClip(id, { is_approved: true });
                  toast.success("Clip approved");
                }}
                onDelete={(id) => {
                  deleteClip(id);
                  toast.error("Clip removed");
                }}
              />
            </div>

            {/* Bottom Bulk Action */}
            <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
              <button 
                onClick={() => approveAll(projectId)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#222222] py-4 text-sm font-bold text-white transition-all hover:bg-[#2a2a2a]"
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
                Approve All Suggested Clips
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
