"use client";

import React from 'react';
import { VideoInfo } from '@/lib/types';
import { User, Eye, Calendar, Clock, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoInfoCardProps {
  videoInfo: VideoInfo;
}

export default function VideoInfoCard({ videoInfo }: VideoInfoCardProps) {
  const formatViews = (views: number) => {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views.toString();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'Unknown') return 'Unknown date';
    // YouTube dates are typically YYYYMMDD
    if (dateStr.length === 8) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[parseInt(month) - 1]} ${day}, ${year}`;
    }
    return dateStr;
  };

  return (
    <div className="glass-card mt-8 p-6 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-visible">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Thumbnail */}
        <div className="w-full md:w-80 shrink-0">
          <div className="relative aspect-video rounded-2xl overflow-hidden group shadow-2xl">
            <img 
              src={videoInfo.thumbnail_url} 
              alt={videoInfo.title}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
            <a 
              href={`https://www.youtube.com/watch?v=${videoInfo.video_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div className="p-3 rounded-full bg-red-600 text-white shadow-xl translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <ExternalLink className="h-6 w-6" />
              </div>
            </a>
            
            <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-black text-white uppercase tracking-wider border border-white/10">
              {videoInfo.duration_formatted}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 py-2">
          <h2 className="text-2xl font-black mb-4 leading-tight tracking-tight text-white line-clamp-2">
            {videoInfo.title}
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
              <User className="h-4 w-4 text-red-500" />
              <span className="truncate">{videoInfo.channel}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
              <Eye className="h-4 w-4 text-red-500" />
              <span>{formatViews(videoInfo.view_count)} views</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
              <Clock className="h-4 w-4 text-red-500" />
              <span>{videoInfo.duration_formatted}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
              <Calendar className="h-4 w-4 text-red-500" />
              <span>{formatDate(videoInfo.upload_date)}</span>
            </div>
          </div>

          <div className="relative">
            <p className="text-xs text-muted-foreground leading-relaxed italic bg-secondary/30 p-4 rounded-xl border border-border/50">
              {videoInfo.description || "No description available."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
