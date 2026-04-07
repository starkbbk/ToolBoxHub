import { create } from "zustand";
import { Clip } from "@/lib/types";
import { clipmaster } from "@/lib/api";

interface ClipState {
  clips: Clip[];
  activeClipId: number | null;
  loading: boolean;
  filters: {
    category: string | null;
    minConfidence: number;
    search: string;
    sortBy: string;
  };
  
  fetchClips: (projectId: number) => Promise<void>;
  updateClip: (clipId: number, data: any) => Promise<void>;
  deleteClip: (clipId: number) => Promise<void>;
  setActiveClip: (clipId: number | null) => void;
  setFilters: (filters: Partial<ClipState["filters"]>) => void;
  approveAll: (projectId: number) => Promise<void>;
}

export const useClipStore = create<ClipState>((set, get) => ({
  clips: [],
  activeClipId: null,
  loading: false,
  filters: {
    category: null,
    minConfidence: 0,
    search: "",
    sortBy: "time",
  },

  fetchClips: async (projectId: number) => {
    set({ loading: true });
    const { filters } = get();
    try {
      const params = {
        category: filters.category,
        min_confidence: filters.minConfidence,
        search: filters.search,
        sort: filters.sortBy,
      };
      const response = await clipmaster.getClips(projectId, params);
      set({ clips: response.data, loading: false });
    } catch (err) {
      set({ loading: false });
    }
  },

  updateClip: async (clipId: number, data: any) => {
    try {
      const response = await clipmaster.updateClip(clipId, data);
      set((state) => ({
        clips: state.clips.map((c) => (c.id === clipId ? response.data : c)),
      }));
    } catch (err) {
      console.error(err);
    }
  },

  deleteClip: async (clipId: number) => {
    try {
      await clipmaster.deleteClip(clipId);
      set((state) => ({
        clips: state.clips.filter((c) => c.id !== clipId),
        activeClipId: state.activeClipId === clipId ? null : state.activeClipId,
      }));
    } catch (err) {
      console.error(err);
    }
  },

  setActiveClip: (clipId) => set({ activeClipId: clipId }),
  
  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  approveAll: async (projectId: number) => {
    try {
      await clipmaster.approveAll(projectId);
      set((state) => ({
        clips: state.clips.map((c) => ({ ...c, is_approved: true })),
      }));
    } catch (err) {
      console.error(err);
    }
  },
}));
