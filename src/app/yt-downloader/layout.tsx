import React from 'react';

export const metadata = {
  title: 'YT Downloader | ToolboxHub',
  description: 'Download YouTube videos in 4K, 1080p, and audio-only formats.',
};

export default function YTDownloaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-transparent pt-32 pb-20">
      {children}
    </div>
  );
}
