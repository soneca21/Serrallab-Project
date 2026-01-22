

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import Verify2FAModal from '@/features/auth/components/Verify2FAModal.tsx';
import { verify2FACode } from '@/features/auth/api/twoFactorAuth.ts';
import { isSystemAdmin } from '@/lib/roles';
import { TEAM_ROLES } from '@/lib/permissions';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [teamRole, setTeamRole] = useState(TEAM_ROLES.OWNER);
  const [primaryUserId, setPrimaryUserId] = useState(null);
  const [accessLoading, setAccessLoading] = useState(false);
  
  // 2FA State
  const [is2FARequired, setIs2FARequired] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);

  const STORAGE_KEY = 'serrallab_auth_session';

  const check2FAStatus = async (userId) => {
    const { data, error } = await supabase
      .from('user_2fa')
      .select('enabled')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error) return false;
    return data?.enabled || false;
  };

  const handle2FAVerification = async (code) => {
    setIsVerifying2FA(true);
    try {
      if (!pendingUser) return false;
      const { valid } = await verify2FACode(code, pendingUser.id);
      
      if (valid) {
        setIs2FARequired(false);
        setUser(pendingUser);
        setPendingUser(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      setIsVerifying2FA(false);
    }
  };
  
  const cancel2FA = useCallback(async () => {
    await supabase.auth.signOut();
    setIs2FARequired(false);
    setPendingUser(null);
    setUser(null);
    setSession(null);
  }, []);

  const signIn = useCallback(async (email, password, rememberMe = false) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Login falhou",
        description: error.message,
      });
      return { data, error };
    }

    if (data.session) {
       // Check 2FA
       const has2FA = await check2FAStatus(data.user.id);
       
       if (has2FA) {
         setPendingUser(data.user);
         setSession(data.session); // Session is technically active but UI blocked
         setIs2FARequired(true);
         // Don't set 'user' yet, which protects routes
       } else {
         setUser(data.user);
         setSession(data.session);
         if (rememberMe) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ session: data.session, timestamp: Date.now() }));
         }
       }
    }

    return { data, error };
  }, [toast]);

  const signUp = useCallback(async (email, password, options = {}) => {
     const { error, data } = await supabase.auth.signUp({ email, password, options });
     if (error) toast({ variant: "destructive", title: "Sign up Failed", description: error.message });
     return { data, error };
  }, [toast]);

  const signOut = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    return { error };
  }, []);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao carregar perfil:', error);
        setProfile(null);
        return;
      }
      setProfile(data || null);
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const resolveAccess = useCallback(async (activeUser, activeProfile) => {
    if (!activeUser) {
      setTeamRole(TEAM_ROLES.OWNER);
      setPrimaryUserId(null);
      setAccessLoading(false);
      return;
    }

    if (isSystemAdmin(activeProfile, activeUser)) {
      setTeamRole('system_admin');
      setPrimaryUserId(activeUser.id);
      setAccessLoading(false);
      return;
    }

    setAccessLoading(true);
    try {
      const { data, error } = await supabase
        .from('secondary_users')
        .select('primary_user_id, permission_level')
        .eq('user_id', activeUser.id)
        .maybeSingle();

      if (!error && data?.primary_user_id) {
        setTeamRole(data.permission_level || TEAM_ROLES.VIEWER);
        setPrimaryUserId(data.primary_user_id);
        return;
      }

      const { data: fallbackData, error: fallbackError } = await supabase
        .from('secondary_users')
        .select('primary_user_id, permission_level')
        .eq('email', activeUser.email)
        .maybeSingle();

      if (!fallbackError && fallbackData?.primary_user_id) {
        setTeamRole(fallbackData.permission_level || TEAM_ROLES.VIEWER);
        setPrimaryUserId(fallbackData.primary_user_id);
        return;
      }
    } catch (err) {
      console.error('Erro ao resolver permissao de acesso:', err);
    } finally {
      setAccessLoading(false);
    }

    setTeamRole(TEAM_ROLES.OWNER);
    setPrimaryUserId(activeUser.id);
  }, []);

  // Init Auth
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      if (initialSession) {
         // Optimization: assume if session exists on load, they passed 2FA before.
         // Or strict: check 2fa again? For better UX, trust the persistent session.
         setSession(initialSession);
         setUser(initialSession.user);
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id);
    } else {
      setProfile(null);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    resolveAccess(user, profile);
  }, [user, profile, resolveAccess]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    profile,
    profileLoading,
    teamRole,
    primaryUserId,
    accessLoading,
    isSecondaryUser: Boolean(primaryUserId && user?.id && primaryUserId !== user.id),
    signUp,
    signIn,
    signOut,
    refreshProfile: () => fetchProfile(user?.id),
    updateUserPassword: async (pw) => await supabase.auth.updateUser({ password: pw })
  }), [user, session, loading, profile, profileLoading, teamRole, primaryUserId, accessLoading, signUp, signIn, signOut, fetchProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      <Verify2FAModal 
        isOpen={is2FARequired} 
        onVerify={handle2FAVerification} 
        onCancel={cancel2FA}
        isLoading={isVerifying2FA}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
