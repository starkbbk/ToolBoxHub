"use client";

import React, { useState, useEffect } from 'react';
import { Youtube, Clipboard, Search, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface URLInputProps {
  onExtract: (url: string) => void;
  isLoading: boolean;
}

export default function URLInput({ onExtract, isLoading }: URLInputProps) {
  const [url, setUrl] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const validateUrl = (value: string) => {
    const pattern = /^(https?:\/\/)?(www\.youtube\.com|youtu\.be|youtube\.com)\/.+$/;
    return pattern.test(value);
  };

  useEffect(() => {
    if (url) {
      setIsValid(validateUrl(url));
    } else {
      setIsValid(null);
    }
  }, [url]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch (err) {
      // Fallback or error toast
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (validateUrl(url)) {
      onExtract(url);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-red-500 transition-colors">
          <Youtube className="h-5 w-5" />
        </div>
        
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube video URL here..."
          className={cn(
            "h-16 pl-12 pr-32 bg-secondary/30 border-border rounded-2xl text-lg transition-all focus:ring-red-500/20",
            isValid === true && "border-green-500/50 bg-green-500/5",
            isValid === false && "border-red-500/50 bg-red-500/5"
          )}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePaste}
            className="h-10 px-3 rounded-xl hover:bg-secondary flex gap-2 text-xs font-bold uppercase tracking-wider"
          >
            <Clipboard className="h-4 w-4" />
            Paste
          </Button>
          
          <div className="flex items-center px-3">
            {isValid === true && <CheckCircle2 className="h-5 w-5 text-green-500 animate-in zoom-in" />}
            {isValid === false && <XCircle className="h-5 w-5 text-red-500 animate-in zoom-in" />}
          </div>
        </div>
      </form>

      <div className="flex justify-center">
        <Button
          onClick={() => handleSubmit()}
          disabled={!isValid || isLoading}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 font-bold text-base shadow-xl shadow-red-500/20 transition-all active:scale-95"
        >
          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Extracting video info...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              <span>Extract Info</span>
            </div>
          )}
        </Button>
      </div>

      <div className="flex justify-center gap-6 text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">
        <span>youtube.com/watch?v=...</span>
        <span>youtu.be/...</span>
        <span>youtube.com/shorts/...</span>
      </div>
    </div>
  );
}
