"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = true
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md pointer-events-auto"
            >
              <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0a0a0c]/80 p-8 shadow-2xl backdrop-blur-2xl">
                {/* Close Button */}
                <button 
                  onClick={onClose}
                  className="absolute right-6 top-6 rounded-full p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Hero Icon */}
                <div className={cn(
                  "mb-6 flex h-16 w-16 items-center justify-center rounded-[1.2rem] shadow-lg",
                  isDestructive 
                    ? "bg-red-500/10 text-red-500 shadow-red-500/20" 
                    : "bg-indigo-500/10 text-indigo-500 shadow-indigo-500/20"
                )}>
                  {isDestructive ? <Trash2 className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
                </div>

                {/* Content */}
                <div className="mb-8">
                  <h3 className="mb-2 text-2xl font-bold text-white leading-tight">
                    {title}
                  </h3>
                  <p className="text-zinc-400 leading-relaxed">
                    {message}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 rounded-2xl bg-white/5 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-white/10"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className={cn(
                      "flex-1 rounded-2xl px-6 py-4 text-sm font-bold text-white shadow-xl transition-all active:scale-[0.98]",
                      isDestructive 
                        ? "bg-red-500 hover:bg-red-600 shadow-red-500/25" 
                        : "bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/25"
                    )}
                  >
                    {confirmText}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
