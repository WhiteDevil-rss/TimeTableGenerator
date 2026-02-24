'use client';

import { ReactNode } from 'react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { LogOut, Clock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useRealtimeUpdates } from '@/lib/hooks/useRealtimeUpdates';
import { useSessionStore } from '@/lib/store/useSessionStore';

interface NavItem {
    title: string;
    href: string;
    icon: ReactNode;
}

interface DashboardLayoutProps {
    children: ReactNode;
    navItems: NavItem[];
    title: string;
}

export function DashboardLayout({ children, navItems, title }: DashboardLayoutProps) {
    const { user, logout, hasHydrated } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    const { timeLeft, decrementTime, resetTimer, forceReset } = useSessionStore();

    useRealtimeUpdates(); // Initialize Real-time mapping

    const handleLogout = useCallback(() => {
        logout();
        forceReset();
        router.push('/login');
    }, [logout, router, forceReset]);

    // Timer logic
    useEffect(() => {
        if (!hasHydrated) return; // Wait for auth hydration too if needed, but session store has its own

        if (timeLeft <= 0) {
            handleLogout();
            return;
        }

        const interval = setInterval(() => {
            decrementTime();
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft, handleLogout, decrementTime, hasHydrated]);

    // Activity tracking – reset timer on user activity, but threshold logic in resetTimer prevents immediate reset on navigation
    useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        events.forEach(e => window.addEventListener(e, resetTimer));
        return () => {
            events.forEach(e => window.removeEventListener(e, resetTimer));
        };
    }, [resetTimer]);


    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getTimerColor = () => {
        if (timeLeft < 60) return 'text-red-500 font-bold animate-pulse';
        if (timeLeft < 180) return 'text-amber-500 font-semibold';
        return 'text-slate-500';
    };

    const TimerDisplay = ({ isMobile = false }) => (
        <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border bg-slate-50 transition-colors",
            timeLeft < 60 ? "border-red-200 bg-red-50" : "border-slate-200",
            isMobile && "px-2 py-1 scale-90"
        )}>
            {timeLeft < 60 ? (
                <ShieldAlert className="w-4 h-4 text-red-500" />
            ) : (
                <Clock className="w-4 h-4 text-slate-400" />
            )}
            <div className="flex flex-col leading-none">
                {!isMobile && <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Session Expires</span>}
                <span className={cn("text-sm tabular-nums", getTimerColor(), isMobile && "text-xs")}>
                    {formatTime(timeLeft)}
                </span>
            </div>
        </div>
    );

    return (
        <div className="h-screen flex overflow-hidden bg-slate-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r flex flex-col hidden md:flex flex-shrink-0">
                <div className="h-16 flex items-center px-6 border-b text-lg font-bold text-primary tracking-tight">
                    Zembaa Solution
                </div>

                <div className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href}>
                            <span className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                                pathname === item.href
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            )}>
                                {item.icon}
                                {item.title}
                            </span>
                        </Link>
                    ))}
                </div>

                <div className="p-4 border-t bg-slate-50/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold truncate max-w-[130px]">{user?.username}</span>
                            <span className="text-xs text-slate-500">{user?.role}</span>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Navbar for Mobile (simplified) */}
                <header className="h-16 bg-white border-b flex items-center justify-between px-6 md:hidden flex-shrink-0">
                    <span className="font-bold text-primary text-sm tracking-tight text-center">Zembaa Solution</span>
                    <div className="flex items-center gap-2">
                        <TimerDisplay isMobile />
                        <Button variant="ghost" size="icon" onClick={handleLogout}>
                            <LogOut className="h-5 w-5 text-red-600" />
                        </Button>
                    </div>
                </header>

                {/* Top Header */}
                <header className="h-16 bg-white border-b hidden md:flex items-center justify-between px-8 shadow-sm z-10 flex-shrink-0">
                    <h1 className="text-xl font-semibold text-slate-800">{title}</h1>

                    <div className="flex items-center gap-4">
                        <TimerDisplay />
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
