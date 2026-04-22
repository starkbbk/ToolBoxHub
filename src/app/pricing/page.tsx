"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Zap, Crown, Shield, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import PageHeader from '@/components/shared/PageHeader';

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
    name: 'God Mode',
    price: { monthly: 299.00, yearly: 2990 },
    description: 'The ultimate powerhouse',
    icon: Crown,
    features: [
      { text: 'Everything in Business', included: true },
      { text: '2GB file size limit (20x Pro)', included: true },
      { text: 'Unlimited team accounts', included: true },
      { text: 'Custom AI model training', included: true },
      { text: 'Dedicated Account Manager', included: true },
      { text: 'SLA Guarantee (99.9%)', included: true },
      { text: 'On-premise deployment', included: true },
    ],
    buttonText: 'Max Potential',
    highlight: false,
    badge: 'Save 50% Yearly',
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
      }) as any;
      
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
    <div className="py-10 max-w-7xl mx-auto px-4">
      <PageHeader 
        icon="💎"
        title="Premium Access"
        description="Choose the plan that fits your needs. Scale as you grow with our professional tool suite."
      />

      {/* Billing Toggle */}
      <div className="mb-16 flex items-center justify-center gap-4">
        <span className={cn("text-sm font-bold transition-colors", billingCycle === 'monthly' ? "text-foreground" : "text-muted-foreground")}>Monthly</span>
        <button 
          onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
          className="w-14 h-7 rounded-full bg-secondary border border-border p-1 relative transition-colors hover:border-primary/50"
        >
          <motion.div 
            animate={{ x: billingCycle === 'monthly' ? 0 : 28 }}
            className="w-5 h-5 rounded-full bg-primary shadow-lg shadow-primary/50"
          />
        </button>
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-bold transition-colors", billingCycle === 'yearly' ? "text-foreground" : "text-muted-foreground")}>Yearly</span>
          <span className="text-[10px] font-black bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/20 uppercase tracking-widest">Save 17%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "glass-card p-8 group",
              plan.highlight && "border-primary/50 ring-1 ring-primary/20"
            )}
          >
            {plan.badge && (
              <div className="absolute top-4 right-4 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-primary/20">
                {plan.badge}
              </div>
            )}

            <div className="flex items-center gap-4 mb-8">
              <div className={cn("p-3 rounded-2xl", plan.highlight ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}>
                <plan.icon className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black tracking-tight">{plan.name}</h2>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black">
                  ${billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly}
                </span>
                <span className="text-muted-foreground text-sm font-bold">
                  /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">{plan.description}</p>
            </div>

            <div className="h-px bg-border/50 mb-8" />

            <ul className="space-y-4 mb-10">
              {plan.features.map((feature, fIndex) => (
                <li key={fIndex} className="flex items-center gap-3 text-sm">
                  {feature.included ? (
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={cn(feature.included ? "text-foreground" : "text-muted-foreground font-medium")}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(plan.name)}
              disabled={loadingPlan !== null || (plan.name.toLowerCase() === user?.subscription_plan?.toLowerCase())}
              className={cn(
                "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-[0.98] shadow-lg",
                (plan.name.toLowerCase() === user?.subscription_plan?.toLowerCase())
                  ? "bg-secondary text-muted-foreground cursor-default"
                  : plan.highlight 
                    ? "bg-primary text-primary-foreground hover:shadow-primary/20" 
                    : "bg-background border border-border hover:bg-secondary",
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

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto">
        <h3 className="text-2xl font-black text-center mb-12 tracking-tighter">Frequently Asked Questions</h3>
        <div className="space-y-4">
          {[
            { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time from your profile settings." },
            { q: "Is there a free trial?", a: "The Free plan is free forever. You can use it to test all basic features." },
            { q: "Do you offer refunds?", a: "We offer a 7-day money-back guarantee for initial Pro plan purchases." },
            { q: "Can I use the API?", a: "API access is available on the Enterprise plan for developers." },
          ].map((faq, i) => (
            <div key={i} className="glass-card p-6 border-border/50">
              <h4 className="font-bold mb-2 text-primary flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {faq.q}
              </h4>
              <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

