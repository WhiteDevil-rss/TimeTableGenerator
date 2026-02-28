import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
    id: string;
    username: string;
    email: string;
    role: 'SUPERADMIN' | 'UNI_ADMIN' | 'DEPT_ADMIN' | 'FACULTY';
    entityId: string | null;
    universityId: string | null;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    hasHydrated: boolean;
    isAuthReady: boolean;
    setHasHydrated: (state: boolean) => void;
    setAuthReady: (state: boolean) => void;
    login: (user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            hasHydrated: false,
            isAuthReady: false,
            setHasHydrated: (state) => set({ hasHydrated: state }),
            setAuthReady: (state) => set({ isAuthReady: state }),
            login: (user) => {
                set({ user, isAuthenticated: true, isAuthReady: true });
            },
            logout: () => {
                set({ user: null, isAuthenticated: false, isAuthReady: true });
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
