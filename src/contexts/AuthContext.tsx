import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { authService } from '../services/auth.service';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  profile: UserProfile | null;
  role: UserRole | null;
  isAdmin: boolean;
  isFrank: boolean;
  isLoading: boolean;
  isRegistrationAllowed: boolean;
  setRegistrationAllowed: (allowed: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role?: UserRole) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { full_name?: string; avatar_url?: string; role?: UserRole }) => Promise<{ error: Error | null }>;
  changePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistrationAllowed, setIsRegistrationAllowedState] = useState<boolean>(() => authService.isRegistrationAllowed());

  const setRegistrationAllowed = (allowed: boolean) => {
    authService.setRegistrationAllowed(allowed);
    setIsRegistrationAllowedState(allowed);
  };

  const refreshProfile = async () => {
    setIsLoading(true);
    try {
      const { profile: currentProfile } = await authService.getCurrentProfile();
      setProfile(currentProfile);
    } catch (err) {
      console.error('Error refreshing profile:', err);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { profile: p } = await authService.getCurrentProfile();
        setProfile(p);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const { profile: p, error } = await authService.signIn(email, password);
    setIsLoading(false);
    if (!error && p) {
      setProfile(p);
    }
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole = 'admin') => {
    setIsLoading(true);
    const { user, session, error } = await authService.signUp(email, password, fullName, role);
    setIsLoading(false);
    if (!error) {
      if (session || user) {
        await refreshProfile();
      }
    }
    return { error };
  };

  const signOut = async () => {
    setIsLoading(true);
    await authService.signOut();
    setProfile(null);
    setIsLoading(false);
  };

  const updateProfile = async (updates: { full_name?: string; avatar_url?: string; role?: UserRole }) => {
    if (!profile) return { error: new Error('No hay sesión activa') };
    const { error } = await authService.updateProfile(profile.id, updates);
    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null);
    }
    return { error };
  };

  const changePassword = async (newPassword: string) => {
    return authService.updatePassword(newPassword);
  };

  const role = profile?.role || null;
  const isAdmin = role === 'admin';
  const isFrank = role === 'frank';

  return (
    <AuthContext.Provider
      value={{
        profile,
        role,
        isAdmin,
        isFrank,
        isLoading,
        isRegistrationAllowed,
        setRegistrationAllowed,
        signIn,
        signUp,
        signOut,
        updateProfile,
        changePassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

