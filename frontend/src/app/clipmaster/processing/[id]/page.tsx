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
      <div className="w-full max-w-2xl rounded-3xl border border-[#2a2a2a] bg-[#1a1a1a] p-10 shadow-2xl">
        <header className="mb-12 text-center">
          <h1 className="mb-2 text-2xl font-bold text-white line-clamp-2 break-words px-4">
            {currentProject?.title || "Processing Video..."}
          </h1>
          <p className="text-zinc-500">
            Hold tight, our AI is working its magic.
          </p>
        </header>

        {/* Step Indicator */}
        <div className="mb-12 flex items-center justify-between px-4">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500",
                  idx < currentStepIndex || lastMessage?.step === "completed" 
                    ? "border-green-500 bg-green-500 text-white" 
                    : idx === currentStepIndex 
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-400" 
                      : "border-[#2a2a2a] bg-zinc-900 text-zinc-600"
                )}>
                  {idx < currentStepIndex || lastMessage?.step === "completed" ? (
                    <Check className="h-5 w-5" />
                  ) : idx === currentStepIndex ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span className="text-xs font-bold">{idx + 1}</span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  idx <= currentStepIndex || lastMessage?.step === "completed" ? "text-white" : "text-zinc-600"
                )}>
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={cn(
                  "h-px w-12 sm:w-20 mx-2 transition-colors duration-500",
                  idx < currentStepIndex ? "bg-green-500" : "bg-[#2a2a2a]"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-white">
              {lastMessage?.message || "Preparing..."}
            </span>
            <span className="font-bold text-indigo-400">
              {lastMessage?.progress || 0}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-900">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out"
              style={{ width: `${lastMessage?.progress || 0}%` }}
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
