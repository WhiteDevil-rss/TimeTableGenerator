'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: Array<'SUPERADMIN' | 'UNI_ADMIN' | 'DEPT_ADMIN' | 'FACULTY'>;
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, isAuthenticated, hasHydrated } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        // Wait for hydration before doing anything
        if (!hasHydrated) return;

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
    }, [isAuthenticated, user, router, allowedRoles, hasHydrated]);

    if (!hasHydrated || !isAuthenticated || !user || !allowedRoles.includes(user.role)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <p className="text-sm text-gray-500 animate-pulse font-medium">Verifying Session...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
