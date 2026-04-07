import { create } from "zustand";
import { Project, ProjectDetail } from "@/lib/types";
import { clipmaster } from "@/lib/api";

interface ProjectState {
  projects: Project[];
  currentProject: ProjectDetail | null;
  loading: boolean;
  error: string | null;
  
  fetchProjects: () => Promise<void>;
  fetchProject: (id: number) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  setCurrentProject: (project: ProjectDetail | null) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const response = await clipmaster.getProjects();
      set({ projects: response.data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchProject: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const response = await clipmaster.getProject(id);
      set({ currentProject: response.data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  deleteProject: async (id: number) => {
    try {
      await clipmaster.deleteProject(id);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),
}));
