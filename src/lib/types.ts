export interface Tool {
  id: string;
  name: string;
  status: string;
}

export interface Clip {
  id: number;
  project_id: number;
  start_time: string;
  end_time: string;
  start_seconds: number;
  end_seconds: number;
  title: string;
  category: "highlight" | "funny" | "emotional" | "key_point" | "topic_change" | "action_item" | "quote" | string;
  confidence: number;
  reason: string;
  is_approved: boolean;
  user_notes?: string;
  created_at: string;
}

export interface Project {
  id: number;
  title: string;
  source_type: "upload" | "youtube";
  source_url?: string;
  file_path?: string;
  audio_path?: string;
  duration_seconds?: number;
  status: "uploading" | "uploaded" | "extracting_audio" | "transcribing" | "analyzing" | "completed" | "failed";
  error_message?: string;
  created_at: string;
  updated_at: string;
  clip_count?: number;
}

export interface Transcript {
  id: number;
  project_id: number;
  full_text: string;
  segments: { start: string; end: string; text: string }[];
  language?: string;
  word_count?: number;
  created_at: string;
}

export interface ProjectDetail extends Project {
  transcript?: Transcript;
  clips: Clip[];
}

export interface Rubric {
  id: number;
  name: string;
  description?: string;
  rules: string[];
  is_default: boolean;
  created_at: string;
}

export interface PDFJob {
  id: number;
  title: string;
  status: string;
  job_type: string | null;
  original_file_path: string | null;
  output_path: string | null;
  error_message: string | null;
  page_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface WSMessage {
  step: string;
  progress: number;
  message: string;
  speed?: string;
  eta?: string;
  timestamp: string;
}

export interface VideoInfo {
  video_id: string;
  title: string;
  channel: string;
  thumbnail_url: string;
  duration_seconds: number;
  duration_formatted: string;
  view_count: number;
  upload_date: string;
  description: string;
}

export interface FormatInfo {
  format_id: string;
  quality_label: string;
  extension: string;
  fps: number | null;
  file_size_bytes: number | null;
  file_size_display: string;
  video_codec: string | null;
  audio_codec: string | null;
  has_video: boolean;
  has_audio: boolean;
  needs_merge: boolean;
  is_available: boolean;
}

export interface DownloadRecord {
  id: number;
  video_id: string;
  title: string;
  channel: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  source_url: string;
  selected_quality: string;
  file_size_bytes: number | null;
  file_size_display: string;
  file_extension: string;
  status: "extracting" | "downloading" | "merging" | "completed" | "failed";
  progress_percent: number;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}
