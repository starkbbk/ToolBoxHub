import { create } from 'zustand';
import { ytDownloader } from '@/lib/api';
import { VideoInfo, FormatInfo, DownloadRecord } from '@/lib/types';
import { toast } from 'sonner';

interface DownloadProgress {
  step: string;
  progress: number;
  speed?: string;
  eta?: string;
  message: string;
}

interface DownloadState {
  videoInfo: VideoInfo | null;
  formats: FormatInfo[];
  selectedFormatId: string | null;
  currentDownloadId: number | null;
  downloadProgress: DownloadProgress | null;
  history: DownloadRecord[];
  isExtracting: boolean;
  isDownloading: boolean;
  error: string | null;

  // Actions
  extractInfo: (url: string) => Promise<void>;
  selectFormat: (formatId: string) => void;
  startDownload: (url: string, formatId: string, qualityLabel: string) => Promise<void>;
  updateProgress: (data: DownloadProgress) => void;
  fetchHistory: () => Promise<void>;
  deleteRecord: (downloadId: number) => Promise<void>;
  clearHistory: () => Promise<void>;
  reset: () => void;
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  videoInfo: null,
  formats: [],
  selectedFormatId: null,
  currentDownloadId: null,
  downloadProgress: null,
  history: [],
  isExtracting: false,
  isDownloading: false,
  error: null,

  reset: () => set({
    videoInfo: null,
    formats: [],
    selectedFormatId: null,
    currentDownloadId: null,
    downloadProgress: null,
    isExtracting: false,
    isDownloading: false,
    error: null
  }),

  extractInfo: async (url: string) => {
    set({ isExtracting: true, error: null, videoInfo: null, formats: [] });
    try {
      const response = await ytDownloader.extractInfo(url);
      if (response.success) {
        set({ 
          videoInfo: response.data.video_info, 
          formats: response.data.formats,
          // Auto-select 1080p if available, otherwise highest below it
          selectedFormatId: response.data.formats.find((f: any) => f.quality_label === '1080p')?.format_id || response.data.formats[0]?.format_id
        });
      }
    } catch (err: any) {
      set({ error: err.message });
      toast.error(err.message || 'Failed to extract video information');
    } finally {
      set({ isExtracting: false });
    }
  },

  selectFormat: (formatId: string) => set({ selectedFormatId: formatId }),

  startDownload: async (url: string, formatId: string, qualityLabel: string) => {
    set({ isDownloading: true, error: null });
    try {
      const response = await ytDownloader.startDownload(url, formatId, qualityLabel);
      if (response.success) {
        set({ currentDownloadId: response.data.download_id });
      }
    } catch (err: any) {
      set({ error: err.message });
      toast.error(err.message || 'Failed to start download');
      set({ isDownloading: false });
    }
  },

  updateProgress: (data: DownloadProgress) => {
    set({ downloadProgress: data });
    if (data.step === 'completed' || data.step === 'failed') {
      set({ isDownloading: false });
      if (data.step === 'completed') {
        get().fetchHistory();
      }
    }
  },

  fetchHistory: async () => {
    try {
      const response = await ytDownloader.getDownloadHistory();
      if (response.success) {
        set({ history: response.data });
      }
    } catch (err: any) {
      console.error('Failed to fetch history:', err.message);
    }
  },

  deleteRecord: async (downloadId: number) => {
    try {
      await ytDownloader.deleteDownload(downloadId);
      set(state => ({
        history: state.history.filter(h => h.id !== downloadId)
      }));
      toast.success('Download record deleted');
    } catch (err: any) {
      toast.error('Failed to delete record');
    }
  },

  clearHistory: async () => {
    try {
      await ytDownloader.clearHistory();
      set({ history: [] });
      toast.success('Download history cleared');
    } catch (err: any) {
      toast.error('Failed to clear history');
    }
  }
}));
