"use client";

import React, { useEffect } from 'react';
import { useDownloadStore } from '@/stores/useDownloadStore';
import { Download, Zap, Timer, Package, CheckCircle2, AlertCircle, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ytDownloader } from '@/lib/api';

interface DownloadProgressProps {
  downloadId: number;
  onReset: () => void;
}

export default function DownloadProgress({ downloadId, onReset }: DownloadProgressProps) {
  const { downloadProgress, updateProgress, videoInfo } = useDownloadStore();

  useEffect(() => {
    if (!downloadId) return;

    // WebSocket connection
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const wsUrl = `${baseUrl.replace('http', 'ws')}/ws/yt-downloader/progress/${downloadId}`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      updateProgress(data);
    };

    socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    return () => {
      socket.close();
    };
  }, [downloadId, updateProgress]);

  const isCompleted = downloadProgress?.step === 'completed';
  const isFailed = downloadProgress?.step === 'failed';
  const progress = downloadProgress?.progress || 0;
  const message = downloadProgress?.message || "Initializing secure connection...";

  const handleSave = () => {
    const url = ytDownloader.getDownloadFileUrl(downloadId);
    window.location.href = url;
  };

  return (
    <div className="glass-card mt-8 p-8 rounded-3xl animate-in zoom-in duration-300">
      <div className="flex items-center gap-4 mb-8">
        <div className={cn(
          "p-4 rounded-2xl",
          isCompleted ? "bg-green-500/20 text-green-500" : 
          isFailed ? "bg-red-500/20 text-red-500" : "bg-red-500/20 text-red-500"
        )}>
          {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : 
           isFailed ? <AlertCircle className="h-6 w-6" /> : <Download className="h-6 w-6 animate-bounce" />}
        </div>
        <div>
          <h3 className="text-xl font-black text-foreground leading-tight uppercase tracking-tighter">
            {isCompleted ? 
             (downloadProgress?.message?.includes("Optimized") ? "Download Optimized!" : "Download Ready!") : 
             isFailed ? "Download Failed" : 
             (message.includes("Optimized") || message.includes("Safe Mode")) ? "Optimizing Quality..." :
             videoInfo ? `Downloading "${videoInfo.title}"` : "Preparing Download..."}
          </h3>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
            {message}
          </p>
        </div>
      </div>

      {!isFailed && (
        <div className="space-y-6">
          <div className="relative h-4 w-full bg-secondary/30 rounded-full overflow-hidden border border-border">
            <div 
              className={cn(
                "absolute inset-y-0 left-0 transition-all duration-500 ease-out",
                isCompleted ? "bg-green-500" : "bg-gradient-to-r from-red-600 to-red-400"
              )}
              style={{ width: `${progress}%` }}
            />
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          </div>

          <div className="flex flex-wrap justify-between gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border">
              <Zap className="h-3 w-3 text-yellow-500" />
              <span>Speed: {downloadProgress?.speed || '---'}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border">
              <Timer className="h-3 w-3 text-blue-500" />
              <span>ETA: {downloadProgress?.eta || '---'}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border">
              <Package className="h-3 w-3 text-indigo-500" />
              <span>Progress: {progress.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-10 flex flex-col md:flex-row gap-4">
        {isCompleted ? (
          <>
            <Button
              onClick={handleSave}
              className="flex-1 h-14 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-bold uppercase tracking-wider shadow-xl shadow-green-500/20"
            >
              <Save className="mr-2 h-5 w-5" />
              Save File to Disk
            </Button>
            <Button
              onClick={onReset}
              variant="outline"
              className="h-14 rounded-2xl border-border hover:bg-secondary font-bold uppercase tracking-wider"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Download Another
            </Button>
          </>
        ) : isFailed ? (
          <Button
            onClick={onReset}
            className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Try Again
          </Button>
        ) : (
          <Button
            disabled
            className="w-full h-14 rounded-2xl bg-secondary/50 text-muted-foreground font-bold uppercase tracking-wider cursor-not-allowed opacity-50"
          >
            Processing... Please wait
          </Button>
        )}
      </div>
    </div>
  );
}
