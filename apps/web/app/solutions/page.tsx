import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
    LuArrowRight,
    LuShieldCheck,
    LuCircleCheck,
    LuUsers,
    LuBuilding2,
    LuLayoutDashboard,
    LuUserCheck,
    LuTriangleAlert,
    LuZap,
    LuClock,
    LuRefreshCw,
    LuGlobe,
} from "react-icons/lu";
import { LandingNav } from "@/components/landing-nav";
import { LandingFooter } from "@/components/landing-footer";

export const metadata: Metadata = {
    title: "Solutions — Zembaa AI Timetable System",
    description:
        "Zembaa delivers tailored solutions for Super Admins, University Admins, Department Admins, and Faculty — eliminating manual scheduling conflicts through AI automation.",
};

const roles = [
    {
        icon: LuShieldCheck,
        color: "neon-cyan",
        role: "Super Admin",
        tagline: "Full system control",
        features: [
            "Global platform configuration",
            "Factory reset with backup protection",
            "All-university data visibility",
            "Seed & restore management",
            "Audit log access",
        ],
    },
    {
        icon: LuBuilding2,
        color: "neon-purple",
        role: "University Admin",
        tagline: "Institution-wide management",
        features: [
            "Manage departments & programs",
            "Create and deactivate user accounts",
            "View institution-wide timetables",
            "Analytics & reporting",
            "Data export & compliance",
        ],
    },
    {
        icon: LuLayoutDashboard,
        color: "pink-400",
        role: "Department Admin",
        tagline: "Departmental control",
        features: [
            "Assign subjects to faculty",
            "Configure room & time slots",
            "Trigger AI timetable generation",
            "Manage department users",
            "Review and publish schedules",
        ],
    },
    {
        icon: LuUserCheck,
        color: "neon-cyan",
        role: "Faculty",
        tagline: "Personal dashboard",
        features: [
            "View personal timetable",
            "Manage profile & availability",
            "Workload visibility",
            "Subject assignment overview",
            "Read-only schedule access",
        ],
    },
];

const useCases = [
    {
        icon: LuZap,
        color: "neon-cyan",
        title: "Conflict-Free Scheduling",
        description: "The AI constraint solver automatically detects and eliminates room overlaps, faculty double-bookings, and time clashes — in seconds.",
    },
    {
        icon: LuUsers,
        color: "neon-purple",
        title: "Resource Optimization",
        description: "Maximize room utilization and distribute faculty workloads evenly across departments, reducing wasted slots.",
    },
    {
        icon: LuGlobe,
        color: "pink-400",
        title: "Multi-Campus Management",
        description: "Manage multiple universities and departments under a single platform with isolated, secure data partitions.",
    },
    {
        icon: LuShieldCheck,
        color: "neon-cyan",
        title: "Secure Authentication & Auditing",
        description: "Firebase Auth + RBAC ensures only the right people see the right data, with every action logged for accountability.",
    },
    {
        icon: LuRefreshCw,
        color: "neon-purple",
        title: "Automated Firebase Sync",
        description: "User accounts and roles sync automatically between your database and Firebase — no manual maintenance required.",
    },
];

const problems = [
    { problem: "Hours spent on manual Excel scheduling", solution: "AI solver generates conflict-free schedules instantly" },
    { problem: "Room double-bookings and overlaps", solution: "Constraint engine prevents conflicts before they occur" },
    { problem: "Faculty overloaded with uneven workloads", solution: "Automated workload balancing across faculty pool" },
    { problem: "No audit trail for schedule changes", solution: "Dual-layer logging of every action in DB and log files" },
    { problem: "Insecure shared admin credentials", solution: "Role-based Firebase Auth with per-user scoped access" },
    { problem: "Semester re-scheduling takes days", solution: "Re-generate timetables in seconds with preserved constraints" },
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

export default function SolutionsPage() {
    return (
        <div
            className="dark transition-none min-h-screen bg-[#0a0a0c] text-slate-200 relative overflow-hidden flex flex-col font-sans selection:bg-neon-cyan/30"
            style={{ colorScheme: "dark" }}
        >
            {/* Background blobs */}
            <div className="absolute top-[-20%] right-[-10%] w-[55%] h-[55%] bg-neon-cyan/15 blur-[130px] rounded-full pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-neon-purple/15 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none" />

            <LandingNav />

            <main className="flex-1 flex flex-col relative z-10">
                {/* ── Hero ── */}
                <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-28 max-w-5xl mx-auto w-full">
                    <div className="inline-flex items-center rounded-full px-4 py-1.5 glass border-neon-purple/30 text-neon-purple text-sm font-medium mb-6 backdrop-blur-md shadow-[0_0_15px_rgba(139,92,246,0.15)]">
                        <span className="flex h-2 w-2 rounded-full bg-neon-purple mr-2 animate-pulse" />
                        Built for Every Role
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-heading font-extrabold tracking-tight text-white leading-[1.1] mb-6">
                        Solutions for{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-pink-400 to-neon-cyan pb-2">
                            Modern Educational
                        </span>
                        <br className="hidden lg:block" /> Institutions
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light mb-10">
                        Whether you manage a single department or an entire university network — Zembaa adapts to your structure, your roles, and your scale.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/login"
                            className="px-8 py-4 rounded-full bg-gradient-to-r from-neon-purple to-pink-500 text-white text-lg font-bold hover:opacity-90 transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(139,92,246,0.4)] flex items-center justify-center gap-2"
                        >
                            Get Started <LuArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/platform"
                            className="px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-lg font-semibold transition-all flex items-center justify-center gap-2"
                        >
                            View Platform
                        </Link>
                    </div>
                </section>

                {/* ── Solutions by Role ── */}
                <section className="px-6 lg:px-12 pb-28 max-w-6xl mx-auto w-full">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-heading font-bold text-white mb-4">Solutions by Role</h2>
                        <p className="text-slate-400 max-w-xl mx-auto">Every stakeholder gets a purpose-built experience with exactly the right tools and permissions.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {roles.map((r) => {
                            const Icon = r.icon;
                            return (
                                <div
                                    key={r.role}
                                    className={`glass-card p-8 rounded-[2rem] transition-all group relative overflow-hidden ${glowMap[r.color]}`}
                                >
                                    <div className="flex items-start gap-5 mb-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0 ${colorMap[r.color]}`}>
                                            <Icon className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-heading font-bold text-white">{r.role}</h3>
                                            <p className="text-slate-400 text-sm mt-1">{r.tagline}</p>
                                        </div>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {r.features.map((f) => (
                                            <li key={f} className="flex items-center gap-3 text-slate-300 text-sm">
                                                <LuCircleCheck className="w-4 h-4 shrink-0 text-neon-cyan/70" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ── Use Cases ── */}
                <section className="px-6 lg:px-12 pb-28 max-w-6xl mx-auto w-full">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-heading font-bold text-white mb-4">Use Cases</h2>
                        <p className="text-slate-400 max-w-xl mx-auto">Real problems Zembaa solves for real institutions — today.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {useCases.map((uc) => {
                            const Icon = uc.icon;
                            return (
                                <div
                                    key={uc.title}
                                    className={`glass-card p-7 rounded-[1.75rem] transition-all group ${glowMap[uc.color]}`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 border ${colorMap[uc.color]}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-heading font-bold text-white mb-2">{uc.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{uc.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ── Problem vs Solution ── */}
                <section className="px-6 lg:px-12 pb-28 max-w-6xl mx-auto w-full">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-heading font-bold text-white mb-4">Before vs After</h2>
                        <p className="text-slate-400 max-w-xl mx-auto">The problems your institution faces today — solved by Zembaa tomorrow.</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Problems column */}
                        <div className="glass-card rounded-[2rem] p-8 border-red-500/20">
                            <div className="flex items-center gap-3 mb-6">
                                <LuTriangleAlert className="w-6 h-6 text-red-400" />
                                <h3 className="text-lg font-heading font-bold text-red-300">Without Zembaa</h3>
                            </div>
                            <ul className="space-y-4">
                                {problems.map((p) => (
                                    <li key={p.problem} className="flex items-start gap-3 text-slate-400 text-sm">
                                        <span className="w-2 h-2 rounded-full bg-red-500/60 shrink-0 mt-1.5" />
                                        {p.problem}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {/* Solutions column */}
                        <div className="glass-card rounded-[2rem] p-8 border-neon-cyan/20">
                            <div className="flex items-center gap-3 mb-6">
                                <LuCircleCheck className="w-6 h-6 text-neon-cyan" />
                                <h3 className="text-lg font-heading font-bold text-neon-cyan">With Zembaa</h3>
                            </div>
                            <ul className="space-y-4">
                                {problems.map((p) => (
                                    <li key={p.solution} className="flex items-start gap-3 text-slate-300 text-sm">
                                        <LuCircleCheck className="w-4 h-4 shrink-0 mt-0.5 text-neon-cyan/70" />
                                        {p.solution}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                        {[
                            { value: "< 5s", label: "Timetable generation time" },
                            { value: "0", label: "Scheduling conflicts" },
                            { value: "4", label: "Role tiers supported" },
                            { value: "100%", label: "Firebase Auth covered" },
                        ].map((stat) => (
                            <div key={stat.label} className="glass-card rounded-2xl p-6 text-center border-neon-purple/20">
                                <div className="text-3xl font-heading font-extrabold text-neon-cyan mb-1">{stat.value}</div>
                                <div className="text-slate-400 text-xs">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── CTA ── */}
                <section className="px-6 pb-28 flex flex-col items-center text-center max-w-3xl mx-auto w-full">
                    <div className="glass-card rounded-[2rem] p-12 border-neon-purple/20 w-full relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/5 via-transparent to-pink-500/5 pointer-events-none" />
                        <LuClock className="w-12 h-12 text-neon-purple mx-auto mb-6" />
                        <h2 className="text-3xl lg:text-4xl font-heading font-bold text-white mb-4">
                            Stop Wasting Time on Manual Schedules
                        </h2>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            Join institutions that have eliminated scheduling conflicts and saved hundreds of hours each semester with Zembaa AI.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/login"
                                className="px-8 py-4 rounded-full bg-gradient-to-r from-neon-purple to-pink-500 text-white text-lg font-bold hover:opacity-90 transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(139,92,246,0.4)] flex items-center justify-center gap-2"
                            >
                                Get Started <LuArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/security"
                                className="px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-lg font-semibold transition-all flex items-center justify-center gap-2"
                            >
                                Security Details
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <LandingFooter />
        </div>
    );
}
