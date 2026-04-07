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

export interface WSMessage {
  step: string;
  progress: number;
  message: string;
  timestamp: string;
}
