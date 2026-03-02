import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, authApi, type User } from './api';
import { supabase } from './supabase';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<boolean>;
  loginWithToken: (token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        const response = await authApi.signin({ email, password });
        
        if (response.success && response.data) {
          const { user, token } = response.data;
          api.setToken(token);
          set({ user, token, isAuthenticated: true });
          return true;
        }
        
        return false;
      },

      register: async (email: string, password: string, firstName?: string, lastName?: string) => {
        const response = await authApi.signup({ email, password, firstName, lastName });
        
        if (response.success && response.data) {
          const { user, token } = response.data;
          api.setToken(token);
          set({ user, token, isAuthenticated: true });
          return true;
        }
        
        return false;
      },

      loginWithToken: (token: string) => {
        api.setToken(token);
        set({ token, isAuthenticated: true });
      },

      logout: () => {
        api.setToken(null);
        set({ user: null, token: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        const { token } = get();

        // First try the stored custom JWT
        if (token) {
          api.setToken(token);
          const response = await authApi.getMe();
          if (response.success && response.data) {
            set({ user: response.data, isAuthenticated: true, isLoading: false });
            return;
          }
          // Token invalid — clear it and fall through to Supabase check
          api.setToken(null);
          set({ token: null });
        }

        // Fall back to Supabase session (enables SSO when projects are merged)
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            api.setToken(session.access_token);
            const response = await authApi.getMe();
            if (response.success && response.data) {
              set({ user: response.data, token: session.access_token, isAuthenticated: true, isLoading: false });
              return;
            }
            api.setToken(null);
          }
        } catch {
          // Supabase unavailable — continue to unauthenticated state
        }

        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);

// Initialize auth check on app load
useAuthStore.getState().checkAuth();

