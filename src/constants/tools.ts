import { Video, FileText, Image, Mic, AlignLeft, Eraser, Download } from "lucide-react";
import { ReactNode } from "react";

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: any; // Using any for component reference
  route: string;
  status: "active" | "coming_soon";
  glowColor: string;
}

export const TOOLS: Tool[] = [
  {
    id: "clipmaster",
    name: "YTClipMaster",
    description: "AI-powered video clip extractor and highlighter.",
    icon: Video,
    route: "/clipmaster",
    status: "active",
    glowColor: "rgba(99, 102, 241, 0.4)",
  },
  {
    id: "yt-downloader",
    name: "YT Downloader",
    description: "Download YouTube videos in 4K, 1080p, or audio-only",
    icon: Download,
    route: "/yt-downloader",
    status: "active",
    glowColor: "rgba(239, 68, 68, 0.4)",
  },
  {
    id: "pdf-converter",
    name: "PDF Converter",
    description: "Convert documents to and from PDF format quickly.",
    icon: FileText,
    route: "/pdf-converter",
    status: "active",
    glowColor: "rgba(59, 130, 246, 0.4)",
  },
  {
    id: "image-compressor",
    name: "Image Compressor",
    description: "Reduce image file size without losing quality.",
    icon: Image,
    route: "/image-compressor",
    status: "active",
    glowColor: "rgba(16, 185, 129, 0.4)",
  },
  {
    id: "audio-transcriber",
    name: "Audio Transcriber",
    description: "Convert speech to text with high accuracy.",
    icon: Mic,
    route: "/audio-transcriber",
    status: "active",
    glowColor: "rgba(245, 158, 11, 0.4)",
  },
  {
    id: "text-summarizer",
    name: "Text Summarizer",
    description: "Condense long articles into short summaries.",
    icon: AlignLeft,
    route: "/text-summarizer",
    status: "active",
    glowColor: "rgba(139, 92, 246, 0.4)",
  },
  {
    id: "text-remover",
    name: "Remove Text from Images/Video",
    description: "Remove text, watermarks, and thumbnails from images/videos.",
    icon: Eraser,
    route: "/text-remover",
    status: "active",
    glowColor: "rgba(99, 102, 241, 0.4)",
  },
];
