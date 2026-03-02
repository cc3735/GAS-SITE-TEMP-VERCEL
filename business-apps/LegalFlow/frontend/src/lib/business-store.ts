import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from './api';

interface Business {
    id: string;
    name: string;
    industry?: string;
    created_at: string;
}

interface BusinessState {
    businesses: Business[];
    selectedBusiness: Business | null;
    fetchBusinesses: () => Promise<void>;
    selectBusiness: (business: Business | null) => void;
}

export const useBusinessStore = create<BusinessState>()(
    persist(
        (set) => ({
            businesses: [],
            selectedBusiness: null,
            fetchBusinesses: async () => {
                const response = await api.get<{ data: Business[] }>('/users/businesses');
                if (response.success && response.data) {
                    set({ businesses: response.data.data });
                }
            },
            selectBusiness: (business) => {
                set({ selectedBusiness: business });
            },
        }),
        {
            name: 'business-storage',
            partialize: (state) => ({ selectedBusiness: state.selectedBusiness }),
        }
    )
);

// Fetch businesses on app load if user is authenticated
import { useAuthStore } from './store';

useAuthStore.subscribe((state, prevState) => {
    if (state.isAuthenticated && !prevState.isAuthenticated) {
        useBusinessStore.getState().fetchBusinesses();
    }
});
