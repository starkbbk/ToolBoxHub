"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/api';
import { Mail, ArrowLeft, Loader2, Send, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await auth.forgotPassword(email);
      if (response.status === 'success') {
        setIsSent(true);
        toast.success('Password reset link sent to your email');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Reset Password
          </h1>
          <p className="text-zinc-500 text-sm mt-2">
            {isSent 
              ? "Check your email for the reset link" 
              : "Enter your email to receive a password reset link"}
          </p>
        </div>

        {isSent ? (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <Send className="h-10 w-10 text-green-500" />
              </div>
            </div>
            <p className="text-zinc-400 text-sm">
              We&apos;ve sent a password reset link to <span className="text-white font-bold">{email}</span>.
            </p>
            <Link 
              href="/login"
              className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="email"
                placeholder="Email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send Reset Link <ArrowRight className="h-4 w-4" /></>}
            </button>

            <div className="text-center">
              <Link 
                href="/login"
                className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-xs transition-colors"
              >
                <ArrowLeft className="h-3 w-3" /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
