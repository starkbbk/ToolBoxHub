"use client";

import React from 'react';
import { DownloadRecord } from '@/lib/types';
import { Save, Trash2, Clock, Monitor, Music, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ytDownloader } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface DownloadCardProps {
  download: DownloadRecord;
  onDelete: (id: number) => void;
}

export default function DownloadCard({ download, onDelete }: DownloadCardProps) {
  const handleDownload = () => {
    if (download.status === 'completed') {
      window.location.href = ytDownloader.getDownloadFileUrl(download.id);
    }
  };

  const isAudio = download.selected_quality === 'audio';

  return (
    <div className="group relative glass-card p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300">
      <div className="flex gap-4">
        {/* Thumbnail Mini */}
        <div className="relative h-16 w-24 shrink-0 rounded-lg overflow-hidden shadow-lg">
          <img 
            src={download.thumbnail_url || ''} 
            alt={download.title}
            className="object-cover w-full h-full"
          />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <a 
              href={download.source_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-1 rounded-full bg-red-600 text-white"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-white truncate group-hover:text-red-400 transition-colors">
            {download.title}
          </h4>
          <div className="flex items-center gap-3 mt-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            <span className="flex items-center gap-1">
              {isAudio ? <Music className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
              {download.selected_quality}
            </span>
            <span>•</span>
            <span>{download.file_size_display}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(download.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            onClick={handleDownload}
            disabled={download.status !== 'completed'}
            className="h-9 w-9 p-0 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white border border-green-500/20"
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(download.id)}
            className="h-9 w-9 p-0 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
