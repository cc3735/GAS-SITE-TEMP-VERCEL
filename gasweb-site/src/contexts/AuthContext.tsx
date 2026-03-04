import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  loading: boolean;
  isGasStaff: boolean;
  intakeCompleted: boolean;
  refetchIntakeStatus: () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null; needsVerification?: boolean }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGasStaff, setIsGasStaff] = useState(false);
  const [intakeCompleted, setIntakeCompleted] = useState(true); // default true to prevent flash-redirect

  const fetchProfileFlags = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('is_gas_staff, intake_completed')
      .eq('id', uid)
      .single();
    setIsGasStaff(data?.is_gas_staff ?? false);
    setIntakeCompleted(data?.intake_completed ?? false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfileFlags(session.user.id);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileFlags(session.user.id);
      } else {
        setIsGasStaff(false);
        setIntakeCompleted(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfileFlags]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };
    const needsVerification = !data.session;
    return { error: null, needsVerification };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/os/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, loading: isLoading, isGasStaff, intakeCompleted, refetchIntakeStatus: () => { if (user) fetchProfileFlags(user.id); }, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
