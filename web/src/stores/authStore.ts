import { create } from 'zustand';
import type { User } from '@/types/auth.types';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true, // true al inicio — esperando GET /auth/me
    setUser: (user) => set({ user, isLoading: false }),
    setLoading: (isLoading) => set({ isLoading }),
    clearUser: () => set({ user: null, isLoading: false }),
}));