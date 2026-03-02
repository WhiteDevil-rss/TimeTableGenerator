import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
    LuArrowRight,
    LuBrain,
    LuUsers,
    LuShieldCheck,
    LuRefreshCw,
    LuZap,
    LuServer,
    LuDatabase,
    LuCloud,
    LuMonitor,
    LuCircleCheck,
    LuSettings,
    LuPlay,
    LuChartBar,
    LuLayers,
} from "react-icons/lu";
import { LandingNav } from "@/components/landing-nav";
import { LandingFooter } from "@/components/landing-footer";

export const metadata: Metadata = {
    title: "Platform — Zembaa AI Timetable System",
    description:
        "Discover Zembaa's AI-driven academic management platform: constraint-based scheduling, role-based access, Firebase Auth, real-time sync, and cloud-ready architecture.",
};

const capabilities = [
    {
        icon: LuBrain,
        color: "neon-cyan",
        title: "AI Timetable Generation",
        description:
            "Our neural constraint solver eliminates scheduling conflicts using advanced mathematical optimization — handling faculty workloads, room capacities, and department constraints simultaneously.",
    },
    {
        icon: LuUsers,
        color: "neon-purple",
        title: "Role-Based Access Control",
        description:
            "Four-tier access hierarchy: Super Admin, University Admin, Department Admin, and Faculty — each with cryptographically scoped permissions and JWT-validated sessions.",
    },
    {
        icon: LuShieldCheck,
        color: "pink-400",
        title: "Firebase Authentication",
        description:
            "Enterprise-grade identity management powered by Google Firebase Auth with secure token handling, session expiration, and seamless multi-device support.",
    },
    {
        icon: LuRefreshCw,
        color: "neon-cyan",
        title: "Real-Time Sync & Logging",
        description:
            "Bidirectional sync between your database and Firebase ensures consistent state across all sessions, backed by dual-layer activity logging for full auditability.",
    },
    {
        icon: LuSettings,
        color: "neon-purple",
        title: "Factory Reset & Seed Management",
        description:
            "Super Admin-controlled factory reset with backup seed protection and 2-step verification ensures safe system-wide resets without data loss.",
    },
    {
        icon: LuZap,
        color: "pink-400",
        title: "Performance & Scalability",
        description:
            "Optimized database queries, asynchronous processing, and a containerized architecture designed to handle multi-campus university deployments at scale.",
    },
];

const steps = [
    {
        number: "01",
        icon: LuSettings,
        title: "Setup",
        description: "Initialize your institution — configure universities, departments, and roles with guided onboarding.",
        color: "neon-cyan",
    },
    {
        number: "02",
        icon: LuUsers,
        title: "Configure",
        description: "Assign subjects, define faculty workloads, and set room capacities and time-slot constraints.",
        color: "neon-purple",
    },
    {
        number: "03",
        icon: LuPlay,
        title: "Generate",
        description: "Run the AI solver — it resolves conflicts automatically and produces conflict-free timetables in seconds.",
        color: "pink-400",
    },
    {
        number: "04",
        icon: LuCircleCheck,
        title: "Manage",
        description: "Review, adjust, and publish timetables. All changes sync in real-time across your institution.",
        color: "neon-cyan",
    },
    {
        number: "05",
        icon: LuChartBar,
        title: "Optimize",
        description: "Use analytics and audit logs to refine constraints over time, improving efficiency each semester.",
        color: "neon-purple",
    },
];

const archPillars = [
    {
        icon: LuMonitor,
        title: "Frontend",
        color: "neon-cyan",
        items: ["Next.js 14 App Router", "Tailwind CSS + Shadcn UI", "React Server & Client Components", "Role-based page routing"],
    },
    {
        icon: LuServer,
        title: "Backend",
        color: "neon-purple",
        items: ["Node.js / Express API", "Prisma ORM", "RESTful + type-safe endpoints", "Turborepo monorepo architecture"],
    },
    {
        icon: LuDatabase,
        title: "Database",
        color: "pink-400",
        items: ["PostgreSQL (primary store)", "Prisma Migrate & seed", "Optimized relational schema", "Full activity logging"],
    },
    {
        icon: LuShieldCheck,
        title: "Firebase Auth",
        color: "neon-cyan",
        items: ["Google Firebase Authentication", "JWT ID token verification", "Role sync on login", "Session management"],
    },
    {
        icon: LuCloud,
        title: "Cloud Ready",
        color: "neon-purple",
        items: ["Google Cloud Platform (GCP)", "Docker containerization", "Horizontal scaling support", "IAM-secured production deploy"],
    },
];

const colorMap: Record<string, string> = {
    "neon-cyan": "text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10",
    "neon-purple": "text-neon-purple border-neon-purple/30 bg-neon-purple/10",
    "pink-400": "text-pink-400 border-pink-400/30 bg-pink-400/10",
};

const glowMap: Record<string, string> = {
    "neon-cyan": "group-hover:border-neon-cyan/50",
    "neon-purple": "group-hover:border-neon-purple/50",
    "pink-400": "group-hover:border-pink-500/50",
};

const blobMap: Record<string, string> = {
    "neon-cyan": "bg-neon-cyan/10 group-hover:bg-neon-cyan/20",
    "neon-purple": "bg-neon-purple/10 group-hover:bg-neon-purple/20",
    "pink-400": "bg-pink-500/10 group-hover:bg-pink-500/20",
};

export default function PlatformPage() {
    return (
        <div
            className="dark transition-none min-h-screen bg-[#0a0a0c] text-slate-200 relative overflow-hidden flex flex-col font-sans selection:bg-neon-cyan/30"
            style={{ colorScheme: "dark" }}
        >
            {/* Background blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-neon-purple/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-neon-cyan/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none" />

            <LandingNav />

            <main className="flex-1 flex flex-col relative z-10">
                {/* ── Hero ── */}
                <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-28 max-w-5xl mx-auto w-full">
                    <div className="inline-flex items-center rounded-full px-4 py-1.5 glass border-neon-cyan/30 text-neon-cyan text-sm font-medium mb-6 backdrop-blur-md shadow-[0_0_15px_rgba(57,193,239,0.15)]">
                        <span className="flex h-2 w-2 rounded-full bg-neon-cyan mr-2 animate-pulse" />
                        Platform Overview
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-heading font-extrabold tracking-tight text-white leading-[1.1] mb-6">
                        Powerful AI-Driven
                        <br className="hidden lg:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-blue-400 to-neon-purple pb-2">
                            {" "}Academic Management
                        </span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light mb-10">
                        A full-stack, enterprise-grade timetabling platform that handles every layer — from AI constraint solving to role-based access, Firebase authentication, and cloud-ready deployment.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/login"
                            className="px-8 py-4 rounded-full bg-gradient-to-r from-neon-cyan to-blue-500 text-slate-900 text-lg font-bold hover:opacity-90 transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(57,193,239,0.4)] flex items-center justify-center gap-2"
                        >
                            Get Started <LuArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/solutions"
                            className="px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-lg font-semibold transition-all flex items-center justify-center gap-2"
                        >
                            Explore Solutions
                        </Link>
                    </div>
                </section>

                {/* ── Core Capabilities ── */}
                <section className="px-6 lg:px-12 pb-28 max-w-6xl mx-auto w-full">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-heading font-bold text-white mb-4">Core Capabilities</h2>
                        <p className="text-slate-400 max-w-xl mx-auto">Everything you need to run a modern, conflict-free academic institution — built in.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {capabilities.map((cap) => {
                            const Icon = cap.icon;
                            return (
                                <div
                                    key={cap.title}
                                    className={`glass-card p-8 rounded-[2rem] transition-colors group relative overflow-hidden ${glowMap[cap.color]}`}
                                >
                                    <div className={`absolute top-0 right-0 w-32 h-32 blur-[50px] rounded-full transition-colors ${blobMap[cap.color]}`} />
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border relative z-10 ${colorMap[cap.color]}`}>
                                        <Icon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-xl font-heading font-bold text-white mb-3 relative z-10">{cap.title}</h3>
                                    <p className="text-slate-400 leading-relaxed font-light relative z-10">{cap.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ── How It Works ── */}
                <section className="px-6 lg:px-12 pb-28 max-w-6xl mx-auto w-full">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-heading font-bold text-white mb-4">How It Works</h2>
                        <p className="text-slate-400 max-w-xl mx-auto">From blank canvas to optimized, conflict-free timetables in five clear steps.</p>
                    </div>
                    <div className="relative">
                        {/* Connecting line — desktop */}
                        <div className="hidden lg:block absolute top-12 left-[calc(10%+28px)] right-[calc(10%+28px)] h-px bg-gradient-to-r from-neon-cyan/40 via-neon-purple/40 to-neon-cyan/40" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                            {steps.map((step) => {
                                const Icon = step.icon;
                                return (
                                    <div key={step.number} className="flex flex-col items-center text-center gap-4">
                                        <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center border z-10 ${colorMap[step.color]} glass`}>
                                            <Icon className="w-6 h-6" />
                                            <span className={`absolute -top-2 -right-2 text-xs font-bold px-1.5 py-0.5 rounded-full bg-[#0a0a0c] border ${colorMap[step.color]}`}>
                                                {step.number}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-heading font-bold text-white">{step.title}</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed font-light">{step.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ── Architecture Overview ── */}
                <section className="px-6 lg:px-12 pb-28 max-w-6xl mx-auto w-full">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-heading font-bold text-white mb-4">Architecture Overview</h2>
                        <p className="text-slate-400 max-w-xl mx-auto">A modern, layered stack designed for performance, security, and cloud-native deployment.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {archPillars.map((pillar) => {
                            const Icon = pillar.icon;
                            return (
                                <div
                                    key={pillar.title}
                                    className={`glass-card p-6 rounded-[1.5rem] transition-all group hover:scale-[1.02] ${glowMap[pillar.color]}`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${colorMap[pillar.color]}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-base font-heading font-bold text-white mb-3">{pillar.title}</h3>
                                    <ul className="space-y-2">
                                        {pillar.items.map((item) => (
                                            <li key={item} className="flex items-start gap-2 text-slate-400 text-sm">
                                                <LuCircleCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-neon-cyan/70" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ── CTA ── */}
                <section className="px-6 pb-28 flex flex-col items-center text-center max-w-3xl mx-auto w-full">
                    <div className="glass-card rounded-[2rem] p-12 border-neon-cyan/20 w-full relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-purple/5 pointer-events-none" />
                        <LuLayers className="w-12 h-12 text-neon-cyan mx-auto mb-6" />
                        <h2 className="text-3xl lg:text-4xl font-heading font-bold text-white mb-4">
                            Ready to Transform Your Scheduling?
                        </h2>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            Deploy Zembaa at your institution today. No conflicts. No wasted resources. Just intelligent, automated timetables.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/login"
                                className="px-8 py-4 rounded-full bg-gradient-to-r from-neon-cyan to-blue-500 text-slate-900 text-lg font-bold hover:opacity-90 transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(57,193,239,0.4)] flex items-center justify-center gap-2"
                            >
                                Get Started <LuArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/security"
                                className="px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-lg font-semibold transition-all flex items-center justify-center gap-2"
                            >
                                See Security Details
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <LandingFooter />
        </div>
    );
}
