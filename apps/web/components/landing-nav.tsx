'use client';

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuCalendar, LuArrowRight, LuMenu, LuX, LuLayoutDashboard } from "react-icons/lu";
import { useAuthStore } from "@/lib/store/useAuthStore";

const navLinks = [
    { label: "Platform", href: "/platform" },
    { label: "Solutions", href: "/solutions" },
    { label: "Security", href: "/security" },
];

export function LandingNav() {
    const { user, isAuthenticated } = useAuthStore();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const getDashboardPath = () => {
        if (!user) return "/dashboard";
        switch (user.role) {
            case 'SUPERADMIN': return "/superadmin";
            case 'UNI_ADMIN': return "/dashboard";
            case 'DEPT_ADMIN': return "/department";
            case 'FACULTY': return "/faculty-panel";
            default: return "/dashboard";
        }
    };

    return (
        <header className="px-6 py-6 lg:px-12 flex justify-between items-center relative z-50">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group cursor-pointer">
                <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl glass border-neon-cyan/20 group-hover:border-neon-cyan/50 transition-all duration-500 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <LuCalendar className="w-6 h-6 text-neon-cyan relative z-10" />
                </div>
                <span className="text-2xl font-heading font-bold text-white tracking-tight">
                    Zembaa<span className="text-neon-cyan">.AI</span>
                </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8 glass px-8 py-3 rounded-full border-white/5">
                {navLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`text-sm font-medium transition-colors ${pathname === link.href
                                ? "text-neon-cyan"
                                : "text-slate-300 hover:text-white"
                            }`}
                    >
                        {link.label}
                    </Link>
                ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex gap-4 items-center">
                {isAuthenticated ? (
                    <Link
                        href={getDashboardPath()}
                        className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold transition-all backdrop-blur-md flex items-center gap-2 group"
                    >
                        Dashboard <LuLayoutDashboard className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </Link>
                ) : (
                    <>
                        <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4">
                            Sign In
                        </Link>
                        <Link
                            href="/login"
                            className="px-6 py-2.5 rounded-full bg-neon-cyan text-[#0a0a0c] text-sm font-bold hover:bg-white hover:text-[#0a0a0c] transition-all shadow-[0_0_20px_rgba(57,193,239,0.3)] hover:shadow-[0_0_30px_rgba(57,193,239,0.6)] flex items-center gap-2"
                        >
                            Get Started <LuArrowRight className="w-4 h-4" />
                        </Link>
                    </>
                )}
            </div>

            {/* Mobile Menu Button */}
            <button
                className="md:hidden p-2 rounded-xl glass border-white/10 text-slate-300 hover:text-white transition-colors"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle navigation menu"
            >
                {mobileOpen ? <LuX className="w-5 h-5" /> : <LuMenu className="w-5 h-5" />}
            </button>

            {/* Mobile Dropdown */}
            {mobileOpen && (
                <div className="absolute top-full left-4 right-4 mt-2 glass rounded-2xl border-white/10 p-4 flex flex-col gap-3 md:hidden shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className={`text-sm font-medium py-2 px-3 rounded-xl transition-colors ${pathname === link.href
                                    ? "text-neon-cyan bg-neon-cyan/10"
                                    : "text-slate-300 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div className="border-t border-white/10 pt-3 mt-1 flex flex-col gap-2">
                        {isAuthenticated ? (
                            <Link
                                href={getDashboardPath()}
                                onClick={() => setMobileOpen(false)}
                                className="w-full text-center px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
                            >
                                Dashboard <LuLayoutDashboard className="w-4 h-4" />
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    onClick={() => setMobileOpen(false)}
                                    className="w-full text-center text-sm font-medium text-slate-300 hover:text-white transition-colors py-2"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/login"
                                    onClick={() => setMobileOpen(false)}
                                    className="w-full text-center px-6 py-2.5 rounded-full bg-neon-cyan text-[#0a0a0c] text-sm font-bold hover:bg-white transition-all shadow-[0_0_20px_rgba(57,193,239,0.3)] flex items-center justify-center gap-2"
                                >
                                    Get Started <LuArrowRight className="w-4 h-4" />
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
