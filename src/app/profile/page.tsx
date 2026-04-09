"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { User, Mail, Shield, Zap, CreditCard, History, Trash2, LogOut, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { auth, subscription } from '@/lib/api';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, logout, checkAuth } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'subscription' | 'settings'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Check if we just returned from a successful Stripe checkout
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (sessionId) {
      handlePostCheckoutRefresh(sessionId);
    }
  }, []);

  const handlePostCheckoutRefresh = async (sessionId: string) => {
    setIsRefreshing(true);
    const loadingToast = toast.loading('Synchronizing your subscription...');
    
    try {
      // 1. Trigger direct verification in the backend
      // This is much more reliable than waiting for the webhook
      console.log('Verifying session:', sessionId);
      await subscription.verifySession(sessionId);
      
      // 2. Now refresh the local user state
      if (checkAuth) {
        await checkAuth();
      }
      
      toast.success('Subscription active! Welcome to your new plan.', { id: loadingToast });
      
      // Clean up the URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    } catch (error) {
      console.error('Verification failed:', error);
      toast.error('Sync delayed. Your plan will update in a few moments.', { id: loadingToast });
    } finally {
      setIsRefreshing(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Shield },
  ];

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto py-10 px-4">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-12 p-8 rounded-3xl bg-card/50 border border-border backdrop-blur-xl shadow-lg">
          <div className="h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-4xl font-extrabold border-4 border-background shadow-2xl relative">
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
            <p className="text-muted-foreground mb-4">{user?.email}</p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <span className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                user?.subscription_plan === 'free' 
                  ? "bg-secondary text-muted-foreground border-border" 
                  : "bg-primary/10 border-primary/50 text-primary"
              )}>
                {user?.subscription_plan} Plan
              </span>
              <span className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                user?.subscription_status === 'active' 
                  ? "bg-green-500/10 border-green-500/50 text-green-500" 
                  : "bg-secondary text-muted-foreground border-border"
              )}>
                {user?.subscription_status || 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-secondary/50 p-1.5 rounded-2xl w-fit border border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all",
                activeTab === tab.id 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background"
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
                    <div key={i} className="p-6 rounded-3xl bg-card border border-border shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">{stat.label}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black">{stat.count}</span>
                        <span className="text-muted-foreground text-sm">/ {user?.subscription_plan === 'free' ? stat.limit : '∞'}</span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary rounded-full mt-4 overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: user?.subscription_plan === 'free' ? `${(stat.count / stat.limit) * 100}%` : '20%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-8 rounded-3xl bg-card border border-border shadow-sm">
                  <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" /> Recent Activity
                  </h3>
                  <div className="space-y-4">
                    <p className="text-muted-foreground text-sm text-center py-10">No recent activity found.</p>
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
                <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-primary/20">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-2xl font-black mb-2 flex items-center gap-3">
                        {user?.subscription_plan?.toUpperCase() || 'FREE'}
                        {user?.subscription_plan && user?.subscription_plan !== 'free' && (
                          <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-[10px] uppercase tracking-widest border border-green-500/20">
                            Active
                          </span>
                        )}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {user?.subscription_plan && user?.subscription_plan !== 'free' 
                          ? "Your subscription is currently active." 
                          : "Upgrade to unlock premium tools and higher limits."}
                      </p>
                    </div>
                    {user?.subscription_plan === 'free' || !user?.subscription_plan ? (
                       <Zap className="h-10 w-10 text-muted-foreground" />
                    ) : (
                      <CheckCircle2 className="h-10 w-10 text-green-500" />
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    {user?.subscription_plan === 'free' || !user?.subscription_plan ? (
                      <button 
                        onClick={() => router.push('/pricing')}
                        className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-105 transition-all shadow-xl shadow-primary/20"
                      >
                        Upgrade Now
                      </button>
                    ) : (
                      <button className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20">
                        Manage Settings
                      </button>
                    )}
                    <button 
                      onClick={async () => {
                        const syncPromise = async () => {
                          await subscription.sync();
                          if (checkAuth) await checkAuth();
                        };

                        toast.promise(syncPromise(), {
                          loading: 'Syncing with Stripe...',
                          success: 'Subscription synced successfully!',
                          error: (err) => `Sync failed: ${err.message || 'Unknown error'}`
                        });
                      }}
                      className="px-8 py-3 bg-secondary text-foreground border border-border rounded-xl font-bold hover:bg-background transition-colors"
                    >
                      Sync Subscription
                    </button>
                    {user?.subscription_plan && user?.subscription_plan !== 'free' && (
                      <button className="px-8 py-3 bg-destructive/10 text-destructive rounded-xl font-bold hover:bg-destructive/20 transition-colors">
                        Cancel Plan
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-8 rounded-3xl bg-card border border-border shadow-sm">
                  <h3 className="text-xl font-black mb-6">Payment History</h3>
                  <div className="space-y-4">
                    <p className="text-muted-foreground text-sm text-center py-6">No payment history available.</p>
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
                    <div className="p-4 rounded-2xl bg-secondary border border-border">
                      <label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block">Full Name</label>
                      <input type="text" defaultValue={user?.name} className="bg-transparent w-full font-bold outline-none border-none text-foreground" />
                    </div>
                    <div className="p-4 rounded-2xl bg-secondary/50 border border-border opacity-70">
                      <label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block">Email (Cannot change)</label>
                      <div className="font-bold text-foreground">{user?.email}</div>
                    </div>
                  </div>
                  <button className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-md shadow-primary/10">Save Changes</button>
                </div>

                <div className="pt-10 border-t border-border">
                  <h3 className="text-xl font-black text-destructive mb-4">Danger Zone</h3>
                  <button className="flex items-center gap-2 px-6 py-3 bg-destructive/10 text-destructive rounded-xl font-bold text-sm hover:bg-destructive/20 transition-colors border border-destructive/10">
                    <Trash2 className="h-4 w-4" /> Delete Account
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar / Logout */}
          <div className="space-y-4">
            <div className="p-8 rounded-3xl bg-card border border-border text-center shadow-lg">
              <LogOut className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-bold mb-2">Logout for now?</h4>
              <p className="text-muted-foreground text-sm mb-6">We'll save your preferences for your next visit.</p>
              <button 
                onClick={logout}
                className="w-full py-4 bg-secondary hover:bg-background text-foreground border border-border rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-sm"
              >
                Sign Out
              </button>
            </div>
            
            <div className="p-6 rounded-3xl bg-primary text-primary-foreground shadow-2xl shadow-primary/20">
              <AlertCircle className="h-6 w-6 mb-4" />
              <h4 className="font-black mb-2 tracking-tight text-white">Need Support?</h4>
              <p className="text-primary-foreground/80 text-xs mb-4">Our team is here to help with any technical or billing issues.</p>
              <button className="w-full py-3 bg-white text-primary rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg">
                Contact Help
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
