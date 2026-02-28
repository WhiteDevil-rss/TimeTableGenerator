'use client';

import { ReactNode, memo } from 'react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { LuLogOut, LuClock, LuShieldAlert } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useRealtimeUpdates } from '@/lib/hooks/useRealtimeUpdates';
import { useSessionStore } from '@/lib/store/useSessionStore';
import { auth } from '@/lib/firebase';
import { ThemeToggle } from '@/components/theme-toggle';

// ── Isolated Timer Component ────────────────────────────────────
// This component manages its own subscription to the session store,
// so only the tiny timer badge re-renders every second — not the entire page.
const SessionTimer = memo(function SessionTimer({ isMobile = false, onExpire }: { isMobile?: boolean; onExpire: () => void }) {
    const { timeLeft, decrementTime, resetTimer, hasHydrated } = useSessionStore();

    useEffect(() => {
        if (!hasHydrated) return;
        if (timeLeft <= 0) { onExpire(); return; }
        const id = setInterval(decrementTime, 1000);
        return () => clearInterval(id);
    }, [timeLeft, decrementTime, hasHydrated, onExpire]);

    // Activity listeners
    useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        events.forEach(e => window.addEventListener(e, resetTimer));
        return () => { events.forEach(e => window.removeEventListener(e, resetTimer)); };
    }, [resetTimer]);

    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
    const critical = timeLeft < 60;
    const warning = timeLeft < 180;

    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border bg-muted/50 transition-colors",
            critical ? "border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800" : "border-border",
            isMobile && "px-2 py-1 scale-90"
        )}>
            {critical ? <LuShieldAlert className="w-4 h-4 text-red-500" /> : <LuClock className="w-4 h-4 text-muted-foreground" />}
            <div className="flex flex-col leading-none">
                {!isMobile && <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Session Expires</span>}
                <span className={cn(
                    "text-sm tabular-nums",
                    critical ? 'text-red-500 font-bold animate-pulse' : warning ? 'text-amber-500 font-semibold' : 'text-foreground/70',
                    isMobile && "text-xs"
                )}>
                    {formatted}
                </span>
            </div>
        </div>
    );
});

// ── Main Layout ─────────────────────────────────────────────────
interface NavItem { title: string; href: string; icon: ReactNode; }
interface DashboardLayoutProps { children: ReactNode; navItems: NavItem[]; title: string; }

export function DashboardLayout({ children, navItems, title }: DashboardLayoutProps) {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const forceReset = useSessionStore(s => s.forceReset);

    useRealtimeUpdates();

    const handleLogout = useCallback(async () => {
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Firebase sign out error', error);
        }
        logout();
        forceReset();
        router.push('/login');
    }, [logout, router, forceReset]);

    return (
        <div className="h-screen flex overflow-hidden bg-background">
            {/* Sidebar */}
            <aside className="w-72 bg-card backdrop-blur-xl border-r border-border/60 flex flex-col hidden md:flex flex-shrink-0 z-20">
                <div className="h-20 flex items-center px-8 text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600 tracking-tight">
                    Zembaa
                </div>

                <div className="flex-1 p-5 space-y-1.5 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href}>
                                <span className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative overflow-hidden",
                                    isActive
                                        ? "text-primary bg-primary/10"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}>
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                                    )}
                                    <div className={cn("transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}>
                                        {item.icon}
                                    </div>
                                    {item.title}
                                </span>
                            </Link>
                        );
                    })}
                </div>

                <div className="p-5 border-t border-border bg-card/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-muted border border-border">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground/90 truncate max-w-[130px]">{user?.username}</span>
                            <span className="text-xs font-medium text-muted-foreground">{user?.role}</span>
                        </div>
                    </div>
                    <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl font-semibold h-11" onClick={handleLogout}>
                        <LuLogOut className="mr-3 h-5 w-5" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Top Navbar for Mobile */}
                <header className="h-16 bg-background/80 backdrop-blur-lg border-b border-border/60 flex items-center justify-between px-6 md:hidden flex-shrink-0 z-30 sticky top-0 transition-colors duration-300">
                    <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600 text-lg tracking-tight text-center">Zembaa</span>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <SessionTimer isMobile onExpire={handleLogout} />
                        <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full bg-muted hover:bg-red-50 dark:hover:bg-red-900/20">
                            <LuLogOut className="h-4 w-4 text-red-600" />
                        </Button>
                    </div>
                </header>

                {/* Top Header */}
                <header className="h-20 bg-background/80 backdrop-blur-xl border-b border-border/60 hidden md:flex items-center justify-between px-10 z-10 sticky top-0 flex-shrink-0 transition-colors duration-300">
                    <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{title}</h1>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <SessionTimer onExpire={handleLogout} />
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 md:p-10 relative">
                    <div className="absolute inset-0 bg-background -z-10" />
                    <div className="max-w-7xl mx-auto space-y-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

