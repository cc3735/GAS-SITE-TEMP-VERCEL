import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, authApi, type User } from './api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<boolean>;
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

      logout: () => {
        api.setToken(null);
        set({ user: null, token: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        const { token } = get();
        
        if (!token) {
          set({ isLoading: false });
          return;
        }

        api.setToken(token);
        const response = await authApi.getMe();
        
        if (response.success && response.data) {
          set({ user: response.data, isAuthenticated: true, isLoading: false });
        } else {
          api.setToken(null);
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
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

