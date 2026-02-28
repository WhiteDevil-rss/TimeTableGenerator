'use client';

import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { api } from '@/lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { login, logout, setHasHydrated } = useAuthStore();

    useEffect(() => {
        // Firebase auth state listener
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    console.log('AuthProvider: Firebase user detected:', firebaseUser.email);
                    // Fetch user details from backend using the Firebase token
                    const response = await api.get('/auth/me');
                    console.log('AuthProvider: Backend sync successful');

                    if (response.data) {
                        login(response.data);
                    } else {
                        console.warn('AuthProvider: No user data in backend response');
                        logout();
                    }
                } else {
                    console.log('AuthProvider: No firebase user found');
                    logout();
                }
            } catch (error) {
                console.error('Failed to fetch user details from backend:', error);
                logout();
            } finally {
                // Mark hydration and readiness AFTER the check is done
                setHasHydrated(true);
                useAuthStore.getState().setAuthReady(true);
            }
        });

        return () => unsubscribe();
    }, [login, logout, setHasHydrated]);

    return <>{children}</>;
}
