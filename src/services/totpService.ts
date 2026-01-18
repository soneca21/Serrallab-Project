
// Service wrapper for TOTP operations
import * as api from '@/features/auth/api/twoFactorAuth';

export const generateSecret = async (email: string) => {
  return await api.generateSecret(email);
};

export const verifyCode = async (code: string, userId: string) => {
  return await api.verify2FACode(code, userId);
};

export const generateBackupCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Generate random 8 character hex string
    const code = Math.random().toString(16).substr(2, 8).toUpperCase();
    codes.push(code);
  }
  return codes;
};
