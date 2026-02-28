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
import { Toast, useToast } from '@/components/ui/toast-alert';

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
    const { toast, showToast, hideToast } = useToast();

    useRealtimeUpdates(showToast);

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
        <div className="h-screen flex overflow-hidden w-full overflow-x-hidden bg-background max-w-[100vw]">
            <Toast toast={toast} onClose={hideToast} />
            {/* Sidebar */}
            <aside className="w-[280px] bg-sidebar-bg/95 backdrop-blur-2xl border-r border-sidebar-border hidden md:flex flex-col flex-shrink-0 z-20">
                <div className="h-20 flex items-center px-8 border-b border-sidebar-border/50">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sidebar-accent border border-sidebar-border shadow-inner mr-3 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <LuClock className="w-5 h-5 text-neon-cyan relative z-10" />
                    </div>
                    <span className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">Zembaa<span className="text-neon-cyan">.AI</span></span>
                </div>

                <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href}>
                                <div className={cn(
                                    "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 group relative overflow-hidden",
                                    isActive
                                        ? "text-slate-900 dark:text-white bg-sidebar-accent/10 dark:bg-sidebar-accent border border-sidebar-border shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                                        : "text-sidebar-fg hover:text-slate-900 dark:hover:text-white hover:bg-sidebar-accent/5 dark:hover:bg-sidebar-accent/50"
                                )}>
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-neon-cyan rounded-r-full shadow-[0_0_10px_rgba(57,193,239,0.5)]" />
                                    )}
                                    <div className={cn("transition-colors relative z-10", isActive ? "text-neon-cyan glow-cyan" : "text-sidebar-fg group-hover:text-neon-cyan")}>
                                        {item.icon}
                                    </div>
                                    <span className="relative z-10">{item.title}</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div className="p-5 border-t border-sidebar-border/50 bg-sidebar-accent/20 backdrop-blur-md relative overflow-hidden">
                    {/* Subtle bottom glow */}
                    <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-32 h-10 bg-neon-cyan/10 blur-[20px] rounded-full" />
                    <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl bg-sidebar-bg border border-sidebar-border shadow-inner relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-blue-500 text-slate-900 flex items-center justify-center font-bold shadow-[0_0_10px_rgba(57,193,239,0.3)]">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-heading font-bold text-slate-900 dark:text-white truncate max-w-[130px]">{user?.username}</span>
                            <span className="text-xs font-semibold text-neon-cyan/70 tracking-wider uppercase">{user?.role}</span>
                        </div>
                    </div>
                    <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl font-semibold h-11 border border-transparent hover:border-red-500/20 transition-all z-10 relative" onClick={handleLogout}>
                        <LuLogOut className="mr-3 h-5 w-5" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-x-hidden relative">
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
                <header className="h-24 bg-background/80 backdrop-blur-2xl border-b border-border/60 dark:border-white/5 hidden md:flex items-center justify-between px-10 z-10 sticky top-0 flex-shrink-0 transition-colors duration-300">
                    <h1 className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h1>
                    <div className="flex items-center gap-6">
                        <ThemeToggle />
                        <SessionTimer onExpire={handleLogout} />
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-10 relative w-full">
                    <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-purple/10 dark:bg-neon-purple/5 blur-[120px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
                    <div className="max-w-7xl mx-auto space-y-8 relative z-10 w-full overflow-x-hidden">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

