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
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <LuLoader className="h-8 w-8 text-primary animate-spin" />
                </div>
            );
        }

        if (!allowedRoles.includes(user.role)) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
                    <div className="text-center space-y-4">
                        <div className="text-red-600 font-bold text-lg">Access Denied</div>
                        <p className="text-sm text-red-500">You don't have permission to access this area.</p>
                        <button
                            onClick={() => router.push('/login')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold"
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <LuLoader className="h-8 w-8 text-primary animate-spin" />
                    <p className="text-sm text-gray-500 animate-pulse font-medium">Verifying Session...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
