import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SessionState {
    timeLeft: number;
    lastReset: number;
    hasHydrated: boolean;
    setTimeLeft: (time: number) => void;
    decrementTime: () => void;
    resetTimer: () => void;
    forceReset: () => void;
}

export const useSessionStore = create<SessionState>()(
    persist(
        (set, get) => ({
            timeLeft: 600, // 10 minutes default
            lastReset: Date.now(),
            hasHydrated: false,
            setTimeLeft: (time) => set({ timeLeft: time }),
            decrementTime: () => set((state) => ({ timeLeft: Math.max(0, state.timeLeft - 1) })),
            resetTimer: () => {
                const now = Date.now();
                const state = get();
                // Only reset if at least 60 seconds have passed OR timer is critical (< 2 mins)
                if (now - state.lastReset > 60000 || state.timeLeft < 120) {
                    set({ timeLeft: 600, lastReset: now });
                }
            },
            forceReset: () => set({ timeLeft: 600, lastReset: Date.now() }),
        }),
        {
            name: 'session-storage',
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.hasHydrated = true;
                }
            },
        }
    )
);
