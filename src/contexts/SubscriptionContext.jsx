
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getSubscription, getCurrentPlan } from '@/features/billing/api/subscription';
import { planGuard } from '@/lib/guards/planGuard';

const SubscriptionContext = createContext(undefined);

export const SubscriptionProvider = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setPlan(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const sub = await getSubscription(user.id);
      setSubscription(sub);

      if (sub && ['active', 'trialing'].includes(sub.status)) {
         const p = await getCurrentPlan(user.id);
         setPlan(p);
      } else {
         setPlan(null);
      }
    } catch (error) {
      console.error("Failed to load subscription context", error);
      // Ensure state is reset on error to prevent stale data
      setSubscription(null);
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isActive = () => {
    return subscription && ['active', 'trialing'].includes(subscription.status);
  };

  const hasFeature = (feature) => {
      // Logic combining plan features
      if (!isActive() || !plan) return false;
      
      // Check JSONB features from DB plan object
      if (plan.features && plan.features[feature]) return true;
      
      return false;
  };

  const canUseFeature = (feature) => {
      const guard = planGuard(feature, plan);
      return guard.allowed;
  };

  return (
    <SubscriptionContext.Provider value={{ 
      subscription, 
      plan, 
      loading, 
      refresh,
      isActive,
      hasFeature,
      canUseFeature
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
