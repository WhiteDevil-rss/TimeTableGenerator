'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { LuGraduationCap, LuLogIn, LuShieldAlert } from 'react-icons/lu';
import { ThemeToggle } from '@/components/theme-toggle';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user, login: loginStore, isAuthenticated } = useAuthStore();
    const router = useRouter();

    // Auto-redirect if already logged in
    useEffect(() => {
        if (isAuthenticated && user) {
            const roleRedirects: Record<string, string> = {
                SUPERADMIN: '/superadmin',
                UNI_ADMIN: '/dashboard',
                DEPT_ADMIN: '/department',
                FACULTY: '/faculty-panel'
            };
            const path = roleRedirects[user.role] || '/dashboard';
            window.location.href = path; // Force hard redirect on persistent session find
        }
    }, [isAuthenticated, user]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // 1. Firebase Auth Login
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('Firebase login successful', userCredential.user.uid);

            // 2. Sync with Backend to get Metadata (Role, EntityId, etc)
            console.log('Syncing with backend @ /auth/login...');
            const response = await api.post('/auth/login');
            console.log('Backend sync successful:', response.data);
            const { user } = response.data;

            if (!user) {
                console.error('No user data in backend response');
                throw new Error('User data missing from response');
            }

            // 3. Update Store and Redirect Forcefully
            console.log('Updating auth store for role:', user.role);
            loginStore(user);

            const roleRedirects: Record<string, string> = {
                SUPERADMIN: '/superadmin',
                UNI_ADMIN: '/dashboard',
                DEPT_ADMIN: '/department',
                FACULTY: '/faculty-panel'
            };
            const targetPath = roleRedirects[user.role] || '/dashboard';
            console.log('Redirecting to:', targetPath);

            // Final check: is window available?
            if (typeof window !== 'undefined') {
                window.location.href = targetPath;
            } else {
                console.error('Window not available for redirect!');
            }


        } catch (err) {
            console.error('LOGIN_FLOW_ERROR:', err);
            const firebaseErr = err as { code?: string; response?: { status?: number, data?: any } };
            console.log('Error Details:', JSON.stringify(firebaseErr.response?.data || {}));

            if (firebaseErr.code === 'auth/wrong-password' || firebaseErr.code === 'auth/user-not-found' || firebaseErr.code === 'auth/invalid-credential') {
                setError('Invalid email or password');
            } else if (firebaseErr.response?.status === 401) {
                setError('Authentication failed. Account not linked in database. (Check seed data)');
            } else {
                setError(`Login failed: ${firebaseErr.response?.data?.error || firebaseErr.code || 'Unknown error'}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden transition-colors duration-300">
            {/* Theme Toggle Positioned at Top Right */}
            <div className="absolute top-6 right-6 z-50">
                <ThemeToggle />
            </div>

            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[100px] animate-pulse-slow" />
                <div className="absolute top-[60%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
            </div>

            <Card className="w-full max-w-md shadow-premium border-0 relative z-10 bg-card/80 backdrop-blur-xl animate-slide-up">
                <CardHeader className="space-y-3 pb-8 pt-10 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-600 shadow-glow mb-2">
                        <LuGraduationCap className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-extrabold tracking-tight text-foreground">
                        Zembaa Solution
                    </CardTitle>
                    <CardDescription className="text-muted-foreground font-medium text-base">
                        Intelligent Scheduling Reinvented
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 animate-fade-in flex items-center gap-2">
                                <LuShieldAlert className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        <div className="space-y-2.5">
                            <label className="text-sm font-semibold text-foreground/80 ml-1">
                                Email Address
                            </label>
                            <Input
                                type="email"
                                placeholder="name@university.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-12 bg-background/50 border-border focus:bg-background focus:ring-primary shadow-sm rounded-xl"
                            />
                        </div>
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-sm font-semibold text-foreground/80">Password</label>
                            </div>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-12 bg-background/50 border-border focus:bg-background focus:ring-primary shadow-sm rounded-xl"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-12 bg-primary hover:bg-primary/90 text-white shadow-md rounded-xl font-semibold transition-all hover:shadow-glow mt-4"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <LuLogIn className="mr-2 h-5 w-5" /> Sign In
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col border-t border-border/50 pt-6 pb-8 text-sm text-center text-muted-foreground">
                    <p>Secure Academic Platform</p>
                    <div className="mt-4 px-4 py-3 bg-muted/30 rounded-xl border border-border w-full text-left flex items-start gap-3">
                        <div className="mt-0.5"><LuShieldAlert className="w-4 h-4 text-primary" /></div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-foreground/80">Authorized Access Only</span>
                            <span className="text-xs text-muted-foreground leading-relaxed max-w-xs mt-0.5">Please use the credentials provided by your institution. Default: password123</span>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
