"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useWebSocket } from "@/hooks/useWebSocket";
import { cn } from "@/lib/utils";
import { Check, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import { useProjectStore } from "@/stores/useProjectStore";

const STEPS = [
  { id: "uploading", label: "Upload", key: "upload" },
  { id: "extracting_audio", label: "Audio", key: "audio" },
  { id: "transcribing", label: "Transcribe", key: "transcribe" },
  { id: "analyzing", label: "Analyze", key: "analyze" },
  { id: "completed", label: "Done", key: "done" }
];

export default function ProcessingPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);
  
  const { lastMessage, isConnected, error: wsError } = useWebSocket(projectId);
  const currentProject = useProjectStore((state) => state.currentProject);
  const fetchProject = useProjectStore((state) => state.fetchProject);

  useEffect(() => {
    fetchProject(projectId);
  }, [projectId, fetchProject]);

  useEffect(() => {
    if (lastMessage?.step === "completed") {
      setTimeout(() => {
        router.push(`/clipmaster/dashboard/${projectId}`);
      }, 2000);
    }
  }, [lastMessage, router, projectId]);

  const getCurrentStepIndex = () => {
    if (lastMessage?.step === "failed") return -1;
    if (lastMessage?.step === "completed") return STEPS.length - 1;
    return STEPS.findIndex(s => s.id === lastMessage?.step);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-4xl rounded-3xl border border-[#2a2a2a] bg-[#1a1a1a] p-10 shadow-2xl relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-[100px]" />
        
        <header className="mb-12 text-center relative z-10">
          <h1 className="mb-2 text-3xl font-bold text-white line-clamp-2 break-words px-8 leading-tight">
            {currentProject?.title || "Processing Video..."}
          </h1>
          <p className="text-zinc-500">
            Hold tight, our AI is working its magic.
          </p>
        </header>

        {/* Step Indicator */}
        <div className="mb-16 flex items-center justify-between px-6 relative z-10">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-3">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-700 shadow-lg",
                  idx < currentStepIndex || lastMessage?.step === "completed" 
                    ? "border-green-500 bg-green-500 text-white shadow-green-500/20" 
                    : idx === currentStepIndex 
                      ? "border-indigo-500 bg-indigo-500/20 text-indigo-400 shadow-indigo-500/30" 
                      : "border-[#2a2a2a] bg-zinc-900 text-zinc-600"
                )}>
                  {idx < currentStepIndex || lastMessage?.step === "completed" ? (
                    <Check className="h-6 w-6" />
                  ) : idx === currentStepIndex ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <span className="text-sm font-bold">{idx + 1}</span>
                  )}
                </div>
                <span className={cn(
                  "text-[11px] font-bold uppercase tracking-widest transition-colors duration-500",
                  idx <= currentStepIndex || lastMessage?.step === "completed" ? "text-white" : "text-zinc-600"
                )}>
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="flex-1 px-4">
                  <div className={cn(
                    "h-[2px] w-full transition-all duration-700",
                    idx < currentStepIndex ? "bg-green-500" : "bg-[#2a2a2a]"
                  )} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress Bar Container */}
        <div className="space-y-6 px-4 relative z-10">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1 overflow-hidden">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Current Phase</p>
              <h3 className="text-lg font-semibold text-white truncate">
                {lastMessage?.message || "Preparing environment..."}
              </h3>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-3xl font-black text-indigo-400 tracking-tighter">
                {Math.round(lastMessage?.progress || 0)}%
              </p>
            </div>
          </div>
          
          <div className="h-4 w-full overflow-hidden rounded-full bg-zinc-900 border border-[#2a2a2a] p-1">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(99,102,241,0.4)]"
              style={{ width: `${Math.max(2, lastMessage?.progress || 0)}%` }}
            />
          </div>
        </div>

        {/* Errors / Footer */}
        {lastMessage?.step === "failed" && (
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-red-500">
            <AlertCircle className="h-6 w-6 flex-shrink-0" />
            <div>
              <p className="font-bold">Processing Failed</p>
              <p className="text-sm opacity-80">{lastMessage.message}</p>
            </div>
          </div>
        )}

        {!isConnected && !lastMessage && (
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Connecting to pipeline...
          </div>
        )}
      </div>
    </div>
  );
}
