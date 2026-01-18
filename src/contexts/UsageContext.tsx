
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getMonthlyLimit, PLAN_LIMITS } from '@/lib/limits';

interface UsageStats {
  messages_sent: number;
  pdfs_generated: number;
  automations_executed: number;
  exports_generated: number;
}

interface UsageContextType {
  usage: UsageStats;
  limits: { sms: number; whatsapp: number; pdfs: number; automations: number };
  percentages: { sms_pct: number; whatsapp_pct: number; pdfs_pct: number; automations_pct: number };
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const UsageContext = createContext<UsageContextType | undefined>(undefined);

export function UsageProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [usage, setUsage] = useState<UsageStats>({
    messages_sent: 0,
    pdfs_generated: 0,
    automations_executed: 0,
    exports_generated: 0,
  });
  const [limits, setLimits] = useState({ sms: 0, whatsapp: 0, pdfs: 0, automations: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Derive plan from profile or subscription (simplified here assuming profile has plan info or we fetch sub)
  // Ideally, we fetch subscription to know the active plan.
  const [planId, setPlanId] = useState('basic');

  const fetchPlan = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('plans(name)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      const pName = data?.plans?.name?.toLowerCase() || 'basic';
      setPlanId(pName);
      
      setLimits({
        sms: getMonthlyLimit(pName, 'sms'),
        whatsapp: getMonthlyLimit(pName, 'whatsapp'),
        pdfs: getMonthlyLimit(pName, 'pdfs'),
        automations: getMonthlyLimit(pName, 'automations'),
      });
    } catch (e) {
      console.error('Error fetching plan', e);
    }
  }, [user]);

  const fetchUsage = useCallback(async () => {
    if (!user) return;
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('usage_counters')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', firstDay)
        .single();

      if (data) {
        setUsage({
          messages_sent: data.messages_sent,
          pdfs_generated: data.pdfs_generated,
          automations_executed: data.automations_executed,
          exports_generated: data.exports_generated,
        });
      }
    } catch (e) {
      console.error('Error fetching usage', e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPlan();
      fetchUsage();
      const interval = setInterval(fetchUsage, 5 * 60 * 1000); // 5 min
      return () => clearInterval(interval);
    }
  }, [user, fetchPlan, fetchUsage]);

  const calculatePct = (used: number, limit: number) => limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  const percentages = {
    sms_pct: calculatePct(usage.messages_sent, limits.sms), // Simplified: messages_sent counts both sms/wa combined in this counter? Or separated? 
    // DB has single 'messages_sent'. We'll map it to SMS limit for visualization if basic/pro, WA for enterprise. 
    // This is a simplification.
    whatsapp_pct: calculatePct(usage.messages_sent, limits.whatsapp),
    pdfs_pct: calculatePct(usage.pdfs_generated, limits.pdfs),
    automations_pct: calculatePct(usage.automations_executed, limits.automations),
  };

  return (
    <UsageContext.Provider value={{ usage, limits, percentages, isLoading, refetch: fetchUsage }}>
      {children}
    </UsageContext.Provider>
  );
}

export function useUsage() {
  const context = useContext(UsageContext);
  if (context === undefined) {
    throw new Error('useUsage must be used within a UsageProvider');
  }
  return context;
}
