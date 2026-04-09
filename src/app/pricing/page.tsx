"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Zap, Crown, Shield, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';

const plans = [
  {
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    description: 'Perfect for casual users',
    icon: Rocket,
    features: [
      { text: '5 PDF conversions / day', included: true },
      { text: '3 text removals / day', included: true },
      { text: '5 image compressions / day', included: true },
      { text: '10MB file size limit', included: true },
      { text: 'Standard quality output', included: true },
      { text: 'Priority processing', included: false },
      { text: 'Batch processing', included: false },
      { text: 'API Access', included: false },
    ],
    buttonText: 'Current Plan',
    highlight: false,
  },
  {
    name: 'Pro',
    price: { monthly: 9.99, yearly: 99 },
    description: 'For power users and creators',
    icon: Crown,
    features: [
      { text: 'Unlimited conversions', included: true },
      { text: 'Unlimited text removals', included: true },
      { text: 'Unlimited image compressions', included: true },
      { text: '100MB file size limit', included: true },
      { text: 'High quality output', included: true },
      { text: 'Priority processing', included: true },
      { text: 'Batch processing', included: true },
      { text: 'API Access', included: false },
    ],
    buttonText: 'Upgrade to Pro',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    price: { monthly: 29.99, yearly: 299 },
    description: 'For teams and businesses',
    icon: Shield,
    features: [
      { text: 'Everything in Pro', included: true },
      { text: '500MB file size limit', included: true },
      { text: 'Custom branding removal', included: true },
      { text: 'Advanced OCR features', included: true },
      { text: 'Team accounts (up to 5)', included: true },
      { text: 'API Access', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'Custom integrations', included: true },
    ],
    buttonText: 'Go Enterprise',
    highlight: false,
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  const handleUpgrade = async (planName: string) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (planName.toLowerCase() === user?.subscription_plan?.toLowerCase()) {
      toast.info("You're already on this plan!");
      return;
    }
    
    if (planName === 'Free') return;

    setLoadingPlan(planName);
    try {
      const response = await api.post('/api/subscription/create-checkout-session', {
        plan: planName,
        cycle: billingCycle
      });
      
      if (response.success && response.data.url) {
        window.location.href = response.data.url;
      } else {
        toast.error('Could not create checkout session');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to start checkout');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="py-20 text-white">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-black tracking-tighter mb-6 bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent"
        >
          Simple, Transparent Pricing
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-zinc-500 text-lg"
        >
          Choose the plan that fits your needs. Scale as you grow with our professional tool suite.
        </motion.p>

        {/* Toggle */}
        <div className="mt-10 flex items-center justify-center gap-4">
          <span className={cn("text-sm font-bold transition-colors", billingCycle === 'monthly' ? "text-white" : "text-zinc-500")}>Monthly</span>
          <button 
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="w-14 h-7 rounded-full bg-white/5 border border-white/10 p-1 relative transition-colors hover:border-indigo-500/50"
          >
            <motion.div 
              animate={{ x: billingCycle === 'monthly' ? 0 : 28 }}
              className="w-5 h-5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50"
            />
          </button>
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-bold transition-colors", billingCycle === 'yearly' ? "text-white" : "text-zinc-500")}>Yearly</span>
            <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 uppercase tracking-widest">Save 17%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "relative rounded-3xl p-8 border transition-all duration-500 hover:translate-y-[-8px]",
              plan.highlight 
                ? "bg-indigo-600/10 border-indigo-500 shadow-2xl shadow-indigo-500/10" 
                : "bg-white/5 border-white/10 hover:border-white/20"
            )}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-violet-500 text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full border border-white/20 shadow-xl">
                {plan.badge}
              </div>
            )}

            <div className="flex items-center gap-3 mb-6">
              <div className={cn("p-3 rounded-2xl", plan.highlight ? "bg-indigo-500 text-white" : "bg-white/5 text-indigo-400")}>
                <plan.icon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">{plan.name}</h2>
                <p className="text-xs text-zinc-500 font-medium">{plan.description}</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">
                  ${billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly}
                </span>
                <span className="text-zinc-500 text-sm font-bold">
                  /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                </span>
              </div>
            </div>

            <ul className="space-y-4 mb-10">
              {plan.features.map((feature, fIndex) => (
                <li key={fIndex} className="flex items-center gap-3 text-sm">
                  {feature.included ? (
                    <div className="h-5 w-5 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
                      <Check className="h-3 w-3 text-indigo-400" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                      <X className="h-3 w-3 text-zinc-600" />
                    </div>
                  )}
                  <span className={cn(feature.included ? "text-zinc-300" : "text-zinc-600")}>{feature.text}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(plan.name)}
              disabled={loadingPlan !== null || (plan.name.toLowerCase() === user?.subscription_plan?.toLowerCase())}
              className={cn(
                "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-[0.98]",
                (plan.name.toLowerCase() === user?.subscription_plan?.toLowerCase())
                  ? "bg-zinc-800 text-zinc-500 cursor-default"
                  : plan.highlight 
                    ? "bg-indigo-500 text-white hover:bg-indigo-400 shadow-xl shadow-indigo-500/20" 
                    : "bg-white/10 text-white hover:bg-white/20",
                loadingPlan === plan.name && "opacity-50 cursor-wait"
              )}
            >
              {loadingPlan === plan.name ? 'Processing...' : 
               (plan.name.toLowerCase() === user?.subscription_plan?.toLowerCase()) ? 'Current Plan' : 
               plan.buttonText}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-20 max-w-4xl mx-auto px-4">
        <h3 className="text-2xl font-black text-center mb-10 tracking-tight">Frequently Asked Questions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time from your profile settings." },
            { q: "Is there a free trial?", a: "The Free plan is free forever. You can use it to test all basic features." },
            { q: "Do you offer refunds?", a: "We offer a 7-day money-back guarantee for initial Pro plan purchases." },
            { q: "Can I use the API?", a: "API access is available on the Enterprise plan for developers." },
          ].map((faq, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h4 className="font-bold mb-2 text-indigo-400">{faq.q}</h4>
              <p className="text-zinc-500 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
