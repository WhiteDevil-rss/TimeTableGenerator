import React from "react";
import Link from "next/link";

export function LandingFooter() {
    return (
        <footer className="py-8 text-center text-slate-500 text-sm border-t border-white/5 relative z-10 glass">
            <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="font-light">© {new Date().getFullYear()} Zembaa AI Timetable Systems. All systems operational.</p>
                <nav className="flex items-center gap-6">
                    <Link href="/platform" className="hover:text-slate-300 transition-colors">Platform</Link>
                    <Link href="/solutions" className="hover:text-slate-300 transition-colors">Solutions</Link>
                    <Link href="/security" className="hover:text-slate-300 transition-colors">Security</Link>
                    <Link href="/login" className="hover:text-slate-300 transition-colors">Sign In</Link>
                </nav>
            </div>
        </footer>
    );
}
