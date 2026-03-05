'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useSessionStore } from '@/lib/store/useSessionStore';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

function TiltWrapper({ children, className }: { children: React.ReactNode, className?: string }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            className={className}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateY,
                rotateX,
                transformStyle: "preserve-3d",
            }}
        >
            <div style={{ transform: "translateZ(30px)" }}>
                {children}
            </div>
        </motion.div>
    );
}

function LoginContent() {
    const searchParams = useSearchParams();
    const isExpired = searchParams.get('expired') === 'true';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { user, login: loginStore, isAuthenticated } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated && user) {
            const roleRedirects: Record<string, string> = {
                SUPERADMIN: '/superadmin',
                UNI_ADMIN: '/dashboard',
                DEPT_ADMIN: '/department',
                FACULTY: '/faculty-panel'
            };
            const path = roleRedirects[user.role] || '/dashboard';
            window.location.href = path;
        }
    }, [isAuthenticated, user]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const token = await userCredential.user.getIdToken();
            const response = await api.post('/auth/login', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const { user } = response.data;

            if (!user) throw new Error('User data missing from response');

            const startSession = useSessionStore.getState().startSession;
            startSession();
            loginStore(user);

            const roleRedirects: Record<string, string> = {
                SUPERADMIN: '/superadmin',
                UNI_ADMIN: '/dashboard',
                DEPT_ADMIN: '/department',
                FACULTY: '/faculty-panel'
            };
            const targetPath = roleRedirects[user.role] || '/dashboard';

            if (typeof window !== 'undefined') {
                window.location.href = targetPath;
            }
        } catch (err) {
            const firebaseErr = err as { code?: string; response?: { status?: number, data?: any } };
            if (firebaseErr.code === 'auth/wrong-password' || firebaseErr.code === 'auth/user-not-found' || firebaseErr.code === 'auth/invalid-credential') {
                setError('Invalid email or password');
            } else if (firebaseErr.response?.status === 401) {
                setError('Authentication failed. Please check your credentials.');
            } else {
                setError(`Login failed: ${firebaseErr.response?.data?.error || firebaseErr.code || 'Unknown error'}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const token = await userCredential.user.getIdToken();
            const response = await api.post('/auth/login', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const { user } = response.data;

            if (!user) throw new Error('User data missing from response');

            const startSession = useSessionStore.getState().startSession;
            startSession();
            loginStore(user);

            const roleRedirects: Record<string, string> = {
                SUPERADMIN: '/superadmin',
                UNI_ADMIN: '/dashboard',
                DEPT_ADMIN: '/department',
                FACULTY: '/faculty-panel'
            };
            const targetPath = roleRedirects[user.role] || '/dashboard';

            if (typeof window !== 'undefined') {
                window.location.href = targetPath;
            }
        } catch (err) {
            setError('Google sign-in failed. Please try again.');
        }
    };

    return (
        <div className="dark min-h-screen flex bg-background-dark text-slate-100 font-heading antialiased">
            {/* Left Column - Visual/Branding */}
            <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(3,7,18,0.9) 0%, rgba(59,130,246,0.1) 50%, rgba(139,92,246,0.1) 100%)' }}
            >
                <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at 20% 80%, rgba(139,92,246,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0,245,255,0.1) 0%, transparent 40%)' }}
                />
                <div className="z-10 flex flex-col items-start pt-8">
                    <div className="flex items-center gap-3 mb-16">
                        <div className="w-10 h-10 rounded-lg bg-neon-cyan/20 flex items-center justify-center border border-neon-cyan/50 shadow-[0_0_15px_rgba(0,245,255,0.3)]">
                            <span className="material-symbols-outlined text-neon-cyan text-2xl">auto_awesome</span>
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-white">Zembaa</span>
                    </div>
                    <h1 className="text-white tracking-tight text-4xl md:text-5xl font-bold leading-tight pb-4">Welcome Back</h1>
                    <p className="text-slate-300 text-lg font-normal leading-relaxed max-w-md pb-12">
                        Sign in to access your scheduling dashboard and manage your academic timetables.
                    </p>
                    <div className="space-y-6">
                        {[
                            "AI-Powered Timetables",
                            "Conflict-Free Scheduling",
                            "Smart Resource Optimization"
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/30">
                                    <span className="material-symbols-outlined text-neon-cyan text-sm">check</span>
                                </div>
                                <p className="text-white text-lg font-medium">{item}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="z-10 mt-auto pb-8">
                    <p className="text-slate-500 text-sm">Zembaa Solution v2.4 • Secure Connection</p>
                </div>
            </div>

            {/* Right Column - Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col relative bg-background-dark">
                {/* Back Button */}
                <div className="absolute top-6 left-6 z-20">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-slate-400 hover:text-neon-cyan transition-colors text-[14px] font-medium group/btn"
                    >
                        <span className="material-symbols-outlined text-[18px] transition-transform group-hover/btn:-translate-x-1">arrow_back</span>
                        <span>Back to Home</span>
                    </Link>
                </div>

                {/* Login Card Container */}
                <div className="flex-1 flex flex-col p-6 py-24 md:p-12 relative z-10 perspective-1000">
                    <TiltWrapper className="w-full max-w-[440px] m-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="w-full rounded-2xl p-8 md:p-10 relative overflow-hidden group"
                            style={{
                                background: 'rgba(17, 24, 39, 0.7)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                border: '1px solid rgba(0, 245, 255, 0.2)',
                                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1), 0 0 40px rgba(0, 245, 255, 0.05)'
                            }}
                        >
                            {/* Glow effect */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-neon-cyan/20 blur-3xl opacity-50 rounded-full pointer-events-none transition-opacity duration-500 group-hover:opacity-70" />

                            <div className="relative z-10">
                                {/* Logo icon */}
                                <div className="flex justify-center mb-8">
                                    <div className="w-12 h-12 rounded-xl bg-neon-cyan/20 flex items-center justify-center border border-neon-cyan/50 shadow-[0_0_20px_rgba(0,245,255,0.4)] transition-transform duration-500 hover:scale-110">
                                        <span className="material-symbols-outlined text-neon-cyan text-3xl">token</span>
                                    </div>
                                </div>

                                {/* Heading */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, delay: 0.2 }}
                                    className="text-center mb-8"
                                >
                                    <h2 className="text-3xl font-bold text-white mb-2">Sign In</h2>
                                    <p className="text-slate-400 text-sm">Access your institutional dashboard</p>
                                </motion.div>

                                <form onSubmit={handleLogin} className="space-y-5">
                                    {/* Session Expired Warning */}
                                    {isExpired && !error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm"
                                        >
                                            <span className="material-symbols-outlined text-lg shrink-0">info</span>
                                            <span>Your session has expired. Please log in again.</span>
                                        </motion.div>
                                    )}

                                    {/* Error */}
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                                        >
                                            <span className="material-symbols-outlined text-lg shrink-0">error</span>
                                            <span>{error}</span>
                                        </motion.div>
                                    )}

                                    {/* Email */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.4, delay: 0.3 }}
                                        className="space-y-1"
                                    >
                                        <label className="block text-sm font-medium text-slate-300" htmlFor="email">Work Email</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="material-symbols-outlined text-slate-500 text-lg">mail</span>
                                            </div>
                                            <input
                                                className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-lg bg-surface-dark/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 focus:border-neon-cyan/50 transition-all text-sm"
                                                id="email"
                                                placeholder="name@university.edu"
                                                required
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </motion.div>

                                    {/* Password */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.4, delay: 0.4 }}
                                        className="space-y-1"
                                    >
                                        <label className="block text-sm font-medium text-slate-300" htmlFor="password">Password</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="material-symbols-outlined text-slate-500 text-lg">lock</span>
                                            </div>
                                            <input
                                                className="block w-full pl-10 pr-10 py-3 border border-white/10 rounded-lg bg-surface-dark/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 focus:border-neon-cyan/50 transition-all text-sm"
                                                id="password"
                                                placeholder="••••••••"
                                                required
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <button
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition-colors"
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                <span className="material-symbols-outlined text-lg">
                                                    {showPassword ? 'visibility' : 'visibility_off'}
                                                </span>
                                            </button>
                                        </div>
                                    </motion.div>

                                    {/* Remember + Forgot */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.4, delay: 0.5 }}
                                        className="flex items-center justify-between pt-1"
                                    >
                                        <div className="flex items-center">
                                            <input
                                                className="h-4 w-4 rounded border-white/20 bg-surface-dark/50 text-neon-cyan focus:ring-neon-cyan/50 cursor-pointer"
                                                id="remember-me"
                                                name="remember-me"
                                                type="checkbox"
                                            />
                                            <label className="ml-2 block text-sm text-slate-300 cursor-pointer" htmlFor="remember-me">Remember me</label>
                                        </div>
                                        <button onClick={() => alert('Forgot password flow placeholder')} type="button" className="font-medium text-slate-400 hover:text-neon-cyan hover:underline transition-colors text-[14px]">Forgot Password?</button>
                                    </motion.div>

                                    {/* Sign In Button */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: 0.6 }}
                                        className="pt-4"
                                    >
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full h-[48px] flex items-center justify-center rounded-xl shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:shadow-[0_0_30px_rgba(0,245,255,0.5)] text-[16px] font-semibold text-white bg-gradient-to-r from-neon-cyan to-blue-500 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                                            type="submit"
                                            disabled={isLoading}
                                        >
                                            <span className="relative z-10 flex items-center gap-2">
                                                {isLoading ? (
                                                    <>
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Signing In...
                                                    </>
                                                ) : (
                                                    <>
                                                        Sign In
                                                    </>
                                                )}
                                            </span>
                                        </motion.button>
                                    </motion.div>
                                </form>

                                {/* Divider */}
                                <div className="mt-8">
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-white/10" />
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-2 bg-surface-dark text-slate-500 rounded-full text-xs font-medium border border-white/5">OR</span>
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <motion.button
                                            onClick={handleGoogleSignIn}
                                            whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full h-[48px] flex justify-center items-center px-4 border border-white/10 rounded-xl bg-transparent text-[16px] font-medium text-slate-300 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
                                            type="button"
                                        >
                                            <svg className="h-5 w-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                            </svg>
                                            Sign in with Google
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </TiltWrapper>

                    {/* Contact Us */}
                    <div className="absolute bottom-8 text-center w-full z-10">
                        <p className="text-sm text-slate-500">
                            Don&apos;t have access?{' '}
                            <button onClick={() => alert('Contact us placeholder')} type="button" className="font-medium text-slate-400 hover:text-white transition-colors underline-offset-2 hover:underline">
                                Contact Us
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background-dark">
                <div className="w-8 h-8 border-4 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
