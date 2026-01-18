
import { useState, useEffect, useCallback } from 'react';
import * as api from '@/features/auth/api/twoFactorAuth';
import { generateBackupCodes } from '@/services/totpService';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const use2FA = () => {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<'totp' | 'sms' | 'email' | undefined>(undefined);

  const refreshStatus = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const status = await api.get2FAStatus();
      setIsEnabled(status?.enabled || false);
      setMethod(status?.method as any);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const enable = async (secret: string, code: string) => {
    const codes = generateBackupCodes();
    await api.enable2FA(secret, code, 'totp', codes);
    await refreshStatus();
    return codes;
  };

  const disable = async () => {
    await api.disable2FA();
    await refreshStatus();
  };

  const verify = async (code: string, userId: string) => {
    return await api.verify2FACode(code, userId);
  };

  return {
    isEnabled,
    loading,
    method,
    enable,
    disable,
    verify,
    refreshStatus
  };
};
