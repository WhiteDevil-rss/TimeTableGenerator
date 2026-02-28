'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { LuLoader } from 'react-icons/lu';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: Array<'SUPERADMIN' | 'UNI_ADMIN' | 'DEPT_ADMIN' | 'FACULTY'>;
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, isAuthenticated, hasHydrated, isAuthReady } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        // Wait for hydration and Firebase initialization before doing anything
        if (!hasHydrated || !isAuthReady) return;

        if (!isAuthenticated || !user) {
            router.push('/login');
            return;
        }

        if (!allowedRoles.includes(user.role)) {
            // Redirect to correct dashboard or fallback
            switch (user.role) {
                case 'SUPERADMIN': router.push('/superadmin'); break;
                case 'UNI_ADMIN': router.push('/dashboard'); break;
                case 'DEPT_ADMIN': router.push('/department'); break;
                case 'FACULTY': router.push('/faculty-panel'); break;
                default: router.push('/login');
            }
        }
    }, [isAuthenticated, user, router, allowedRoles, hasHydrated, isAuthReady]);

    // If auth is strictly known to be failed or unauthorized, show specific states
    if (hasHydrated && isAuthReady) {
        if (!isAuthenticated || !user) {
            // This will trigger the redirect in useEffect, but let's show a loader for now
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0c]">
                    <div className="glass-card bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center gap-4">
                        <LuLoader className="h-10 w-10 text-indigo-600 dark:text-neon-cyan animate-spin" />
                    </div>
                </div>
            );
        }

        if (!allowedRoles.includes(user.role)) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0c] p-4">
                    <div className="text-center space-y-4 glass-card bg-white/80 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 p-8 rounded-2xl shadow-2xl max-w-sm w-full">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="text-red-600 dark:text-red-400 font-bold text-xl font-display">Access Denied</div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">You don't have permission to access this area.</p>
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full mt-4 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-red-500/30 transition-all uppercase tracking-wider"
                        >
                            Return to Login
                        </button>
                    </div>
                </div>
            );
        }
    }

    if (!hasHydrated || !isAuthReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0c]">
                <div className="flex flex-col items-center gap-6 glass-card bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-12 rounded-3xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse" />
                    <LuLoader className="h-12 w-12 text-indigo-600 dark:text-neon-cyan animate-spin" />
                    <p className="text-sm text-slate-600 dark:text-slate-300 animate-pulse font-bold tracking-widest uppercase">Verifying Session...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
