"use client";

import { Play, Link as LinkIcon, Check, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface URLInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function URLInput({ value, onChange }: URLInputProps) {
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!value) {
      setIsValid(null);
      return;
    }
    const pattern = /^(https?:\/\/)?(www\.youtube\.com|youtu\.be)\/.+$/;
    setIsValid(pattern.test(value));
  }, [value]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange(text);
    } catch (err) {
      console.error("Paste failed", err);
    }
  };

  return (
    <div className="w-full">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <Play className={cn(
            "h-5 w-5",
            isValid === true ? "text-red-500" : "text-zinc-500"
          )} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className={cn(
            "h-14 w-full rounded-2xl border bg-[#1a1a1a] pl-12 pr-32 text-white outline-none transition-all focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20",
            isValid === true ? "border-green-500/30" : isValid === false ? "border-red-500/30" : "border-[#2a2a2a]"
          )}
        />
        <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2">
          {isValid === true && <Check className="h-5 w-5 text-green-500" />}
          {isValid === false && <AlertCircle className="h-5 w-5 text-red-500" />}
          <button
            onClick={handlePaste}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Paste
          </button>
        </div>
      </div>
      {isValid === false && (
        <p className="mt-2 text-xs text-red-500">Please enter a valid YouTube URL</p>
      )}
    </div>
  );
}
