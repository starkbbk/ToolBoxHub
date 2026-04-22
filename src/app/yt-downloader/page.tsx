"use client";

import React from 'react';
import URLInput from '@/components/yt-downloader/URLInput';
import VideoInfoCard from '@/components/yt-downloader/VideoInfoCard';
import QualitySelector from '@/components/yt-downloader/QualitySelector';
import DownloadProgress from '@/components/yt-downloader/DownloadProgress';
import DownloadHistory from '@/components/yt-downloader/DownloadHistory';
import { useDownloadStore } from '@/stores/useDownloadStore';
import { Button } from '@/components/ui/button';
import { Download, ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { cn } from "@/lib/utils";

export default function YTDownloaderPage() {
  const { 
    videoInfo, 
    formats, 
    selectedFormatId, 
    isExtracting, 
    extractInfo, 
    selectFormat,
    startDownload,
    currentDownloadId,
    isDownloading,
    reset
  } = useDownloadStore();

  const handleDownload = () => {
    if (videoInfo && selectedFormatId) {
      const selectedFormat = formats.find(f => f.format_id === selectedFormatId);
      if (selectedFormat) {
        startDownload(
          `https://www.youtube.com/watch?v=${videoInfo.video_id}`, 
          selectedFormatId, 
          selectedFormat.quality_label
        );
      }
    }
  };

  const selectedFormat = formats.find(f => f.format_id === selectedFormatId);

  return (
    <div className="container max-w-4xl mx-auto px-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
        <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
          <Home className="h-3 w-3" />
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-white">YT Downloader</span>
      </div>

      {/* Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest mb-4">
          <Download className="h-3 w-3" />
          Premium Video Downloader
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-4 italic">
          YT DOWNLOADER
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl font-medium leading-relaxed">
          The ultimate tool for extracting and downloading high-quality YouTube videos. Supports up to 4K resolution and audio extraction.
        </p>
      </div>

      {/* URL Input */}
      {!currentDownloadId && (
        <URLInput onExtract={extractInfo} isLoading={isExtracting} />
      )}

      {/* Video Content & Initializing State */}
      {(videoInfo && (!currentDownloadId || isDownloading)) && (
        <div className={cn(
          "animate-in fade-in slide-in-from-bottom-8 duration-700",
          currentDownloadId ? "opacity-30 blur-[2px] pointer-events-none transition-all duration-1000" : ""
        )}>
          {!currentDownloadId && <VideoInfoCard videoInfo={videoInfo} />}
          
          {!currentDownloadId && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-8">
              <div className="lg:col-span-2">
                <QualitySelector 
                  formats={formats} 
                  selectedFormatId={selectedFormatId} 
                  onSelect={selectFormat} 
                />
              </div>
              
              <div className="lg:sticky lg:top-32 h-fit space-y-4">
                <div className="glass-card p-6 rounded-3xl border border-white/5 bg-red-500/5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Summary</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-bold">Quality:</span>
                      <span className="text-white font-black">{selectedFormat?.quality_label || '---'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-bold">Size:</span>
                      <span className="text-white font-black">{selectedFormat?.file_size_display || '---'}</span>
                    </div>
                    <div className="pt-4 border-t border-white/5">
                      <Button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="w-full h-14 rounded-2xl bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-wider shadow-xl shadow-white/5"
                      >
                        {isDownloading ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            <span>Preparing...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Download className="h-5 w-5" />
                            <span>Download Now</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress View */}
      {currentDownloadId && (
        <div className="animate-in slide-in-from-top-4 duration-500">
          <DownloadProgress downloadId={currentDownloadId} onReset={reset} />
        </div>
      )}

      {/* History */}
      {!currentDownloadId && !isDownloading && <DownloadHistory />}
    </div>
  );
}
