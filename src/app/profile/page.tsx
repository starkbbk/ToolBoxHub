"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { User, Mail, Shield, Zap, CreditCard, History, Trash2, LogOut, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { auth } from '@/lib/api';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'subscription' | 'settings'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Shield },
  ];

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto py-10 px-4">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-12 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-4xl font-extrabold border-4 border-white/10 shadow-2xl relative">
            {user?.profile_picture ? (
              <img src={user.profile_picture} alt={user.name} className="h-full w-full rounded-full object-cover" />
            ) : (
              user?.name ? user.name.charAt(0).toUpperCase() : 'U'
            )}
            {user?.subscription_plan !== 'free' && (
              <div className="absolute -bottom-2 -right-2 bg-amber-400 p-2 rounded-full shadow-lg">
                <Zap className="h-4 w-4 text-black fill-black" />
              </div>
            )}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-black tracking-tight mb-1">{user?.name}</h1>
            <p className="text-zinc-500 mb-4">{user?.email}</p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <span className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                user?.subscription_plan === 'free' 
                  ? "bg-white/5 border-white/10 text-zinc-400" 
                  : "bg-indigo-500/10 border-indigo-500/50 text-indigo-400"
              )}>
                {user?.subscription_plan} Plan
              </span>
              <span className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                user?.subscription_status === 'active' 
                  ? "bg-green-500/10 border-green-500/50 text-green-400" 
                  : "bg-white/5 border-white/10 text-zinc-500"
              )}>
                {user?.subscription_status || 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all",
                activeTab === tab.id 
                  ? "bg-indigo-600 text-white shadow-lg" 
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {activeTab === 'overview' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Usage Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'PDF Conversions', count: user?.usage?.pdf_conversions || 0, limit: 5 },
                    { label: 'Text Removals', count: user?.usage?.text_removals || 0, limit: 3 },
                    { label: 'Compressions', count: user?.usage?.image_compressions || 0, limit: 5 },
                  ].map((stat, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">{stat.label}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black">{stat.count}</span>
                        <span className="text-zinc-600 text-sm">/ {user?.subscription_plan === 'free' ? stat.limit : '∞'}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full mt-4 overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500" 
                          style={{ width: user?.subscription_plan === 'free' ? `${(stat.count / stat.limit) * 100}%` : '20%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                  <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                    <History className="h-5 w-5 text-indigo-400" /> Recent Activity
                  </h3>
                  <div className="space-y-4">
                    <p className="text-zinc-500 text-sm text-center py-10">No recent activity found.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'subscription' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-2xl font-black mb-2">Current Plan: {user?.subscription_plan?.toUpperCase() || 'FREE'}</h3>
                      <p className="text-zinc-400 text-sm">Your next billing date is April 24, 2024</p>
                    </div>
                    {user?.subscription_plan === 'free' ? (
                       <Zap className="h-10 w-10 text-zinc-600" />
                    ) : (
                      <CheckCircle2 className="h-10 w-10 text-green-500" />
                    )}
                  </div>
                  
                  <div className="flex gap-4">
                    {user?.subscription_plan === 'free' ? (
                      <button 
                        onClick={() => router.push('/pricing')}
                        className="px-8 py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-colors"
                      >
                        Upgrade Now
                      </button>
                    ) : (
                      <button className="px-8 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-colors">
                        Manage Billing
                      </button>
                    )}
                    <button className="px-8 py-3 bg-red-500/10 text-red-500 rounded-xl font-bold hover:bg-red-500/20 transition-colors">
                      Cancel Plan
                    </button>
                  </div>
                </div>

                <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                  <h3 className="text-xl font-black mb-6">Payment History</h3>
                  <div className="space-y-4">
                    <p className="text-zinc-500 text-sm text-center py-6">No payment history available.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h3 className="text-xl font-black mb-4">Account Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <label className="text-[10px] font-black uppercase text-zinc-500 mb-1 block">Full Name</label>
                      <input type="text" defaultValue={user?.name} className="bg-transparent w-full font-bold outline-none" />
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 opacity-50">
                      <label className="text-[10px] font-black uppercase text-zinc-500 mb-1 block">Email (Cannot change)</label>
                      <div className="font-bold">{user?.email}</div>
                    </div>
                  </div>
                  <button className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm">Save Changes</button>
                </div>

                <div className="pt-10 border-t border-white/10">
                  <h3 className="text-xl font-black text-red-500 mb-4">Danger Zone</h3>
                  <button className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 rounded-xl font-bold text-sm hover:bg-red-500/20 transition-colors">
                    <Trash2 className="h-4 w-4" /> Delete Account
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar / Logout */}
          <div className="space-y-4">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center">
              <LogOut className="h-8 w-8 text-zinc-500 mx-auto mb-4" />
              <h4 className="font-bold mb-2">Logout for now?</h4>
              <p className="text-zinc-500 text-sm mb-6">We'll save your preferences for your next visit.</p>
              <button 
                onClick={logout}
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
              >
                Sign Out
              </button>
            </div>
            
            <div className="p-6 rounded-3xl bg-indigo-600 text-white shadow-2xl shadow-indigo-500/20">
              <AlertCircle className="h-6 w-6 mb-4" />
              <h4 className="font-black mb-2 tracking-tight">Need Support?</h4>
              <p className="text-indigo-100 text-xs mb-4">Our team is here to help with any technical or billing issues.</p>
              <button className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold text-[10px] uppercase tracking-widest">
                Contact Help
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
