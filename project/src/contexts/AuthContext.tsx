import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Auth: Initial session check:', {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth: State changed:', {
        event,
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      });
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    // EXPERIMENT: If on Vercel, let's try NOT sending a redirectTo param.
    // This forces Supabase to use the "Site URL" configured in the dashboard.
    // If this still goes to localhost, then the "Site URL" in Supabase is definitely set to localhost.
    
    let options: any = {
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    };

    if (window.location.hostname.includes('localhost')) {
       options.redirectTo = `${window.location.origin}/auth/callback`;
       console.log('Using Localhost Redirect:', options.redirectTo);
    } else {
       console.log('Using Default Site URL from Supabase Settings (No redirect param sent)');
    }
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options,
    });
    if (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
