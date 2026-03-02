import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
    LuArrowRight,
    LuShieldCheck,
    LuLock,
    LuKey,
    LuEye,
    LuTriangleAlert,
    LuCloud,
    LuDatabase,
    LuActivity,
    LuRefreshCw,
    LuCircleCheck,
    LuServer,
    LuFileText,
    LuZap,
} from "react-icons/lu";
import { LandingNav } from "@/components/landing-nav";
import { LandingFooter } from "@/components/landing-footer";

export const metadata: Metadata = {
    title: "Security — Zembaa AI Timetable System",
    description:
        "Zembaa uses Firebase Authentication, RBAC, end-to-end HTTPS, dual-layer audit logging, and GCP cloud infrastructure to deliver enterprise-grade security and data protection.",
};

const authFeatures = [
    {
        icon: LuKey,
        title: "Firebase Authentication",
        description: "Google Firebase Auth powers all user identity management — securing login flows with industry-standard JWT token issuance and validation.",
    },
    {
        icon: LuShieldCheck,
        title: "Role-Based Access Control (RBAC)",
        description: "Access is strictly scoped per role (Super Admin, University, Department, Faculty). Each JWT token carries the user's role, validated on every API request.",
    },
    {
        icon: LuLock,
        title: "Secure Login Handling",
        description: "Passwords are never stored in plaintext. Firebase handles credential storage with bcrypt hashing and secure token exchange over HTTPS.",
    },
    {
        icon: LuActivity,
        title: "Session Timeout Management",
        description: "Automatic session expiry with seamless token refresh on the frontend. Expired sessions are gracefully handled without exposing sensitive data.",
    },
];

const dataProtectionFeatures = [
    {
        icon: LuLock,
        title: "Encrypted Communication",
        description: "All client-server communication is enforced over HTTPS/TLS. No sensitive data ever travels over unencrypted channels.",
    },
    {
        icon: LuKey,
        title: "Environment Variable Protection",
        description: "API keys, Firebase credentials, and database connection strings are stored in environment variables — never hardcoded in source code.",
    },
    {
        icon: LuRefreshCw,
        title: "Secure DB ↔ Firebase Sync",
        description: "User accounts sync bidirectionally between PostgreSQL and Firebase Auth using server-side admin SDK calls — no client-side exposure of admin credentials.",
    },
    {
        icon: LuDatabase,
        title: "Data Isolation per Tenant",
        description: "Each university and department operates in cryptographically isolated data partitions. Cross-tenant data leakage is architecturally prevented.",
    },
];

const auditFeatures = [
    {
        icon: LuFileText,
        title: "Dual Log Storage",
        description: "Every action is logged in two places simultaneously — the PostgreSQL database for queryable history, and rotating log files for backup and compliance.",
    },
    {
        icon: LuEye,
        title: "User Activity Tracking",
        description: "All login events, administrative actions, timetable generation runs, and data modifications are attributed to a specific user with timestamps.",
    },
    {
        icon: LuActivity,
        title: "Real-Time Audit Trail",
        description: "Super Admins can access a live audit trail — ideal for identifying unauthorized access attempts or debugging unexpected system state.",
    },
];

const resetFeatures = [
    {
        icon: LuTriangleAlert,
        title: "Super Admin-Only Reset",
        description: "The factory reset operation is gated exclusively to the Super Admin role. No other role can trigger or initiate a reset — enforced at both API and role levels.",
    },
    {
        icon: LuShieldCheck,
        title: "2-Step Verification for Destructive Actions",
        description: "Critical destructive actions require an explicit confirmation step, preventing accidental or unauthorized system-wide data deletion.",
    },
    {
        icon: LuDatabase,
        title: "Seed Backup Protection",
        description: "Before any reset, seed data backups are preserved and secured. Restoring from seed is available to Super Admins for reliable system recovery.",
    },
];

const cloudFeatures = [
    {
        icon: LuCloud,
        title: "Google Cloud Platform (GCP)",
        description: "Deployable on GCP with containerized services, Cloud SQL for PostgreSQL, and Google Firebase for auth and realtime features.",
    },
    {
        icon: LuKey,
        title: "Secure IAM Roles",
        description: "GCP IAM roles control which services can access which resources. Principle of least privilege is applied to all cloud service accounts.",
    },
    {
        icon: LuZap,
        title: "Scalable Architecture",
        description: "Docker-based containerization enables horizontal scaling. Deploy across multiple regions with load balancing and zero-downtime deployments.",
    },
    {
        icon: LuServer,
        title: "Disaster Recovery Readiness",
        description: "Automated database backups, seed restore capabilities, and stateless service design ensure rapid recovery in case of infrastructure failure.",
    },
];

const complianceItems = [
    { icon: LuCircleCheck, text: "Data integrity enforced at database schema level via constraints and transactions" },
    { icon: LuCircleCheck, text: "System resilience through containerized, stateless architecture" },
    { icon: LuCircleCheck, text: "Disaster recovery via seed backups, export tools, and GCP backup policies" },
    { icon: LuCircleCheck, text: "Role-based data access prevents unauthorized information disclosure" },
    { icon: LuCircleCheck, text: "All user-identifiable data is isolated and scoped per institution" },
    { icon: LuCircleCheck, text: "Audit logs provide non-repudiation for all administrative actions" },
];

function SecuritySection({
    id,
    badge,
    badgeColor,
    title,
    subtitle,
    children,
}: {
    id: string;
    badge: string;
    badgeColor: "neon-cyan" | "neon-purple" | "pink-400";
    title: string;
    subtitle: string;
    children: React.ReactNode;
}) {
    const badgeStyles = {
        "neon-cyan": "border-neon-cyan/30 text-neon-cyan shadow-[0_0_15px_rgba(57,193,239,0.15)] [&>span]:bg-neon-cyan",
        "neon-purple": "border-neon-purple/30 text-neon-purple shadow-[0_0_15px_rgba(139,92,246,0.15)] [&>span]:bg-neon-purple",
        "pink-400": "border-pink-400/30 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.15)] [&>span]:bg-pink-400",
    };
    return (
        <section id={id} className="px-6 lg:px-12 pb-28 max-w-6xl mx-auto w-full">
            <div className="text-center mb-16">
                <div className={`inline-flex items-center rounded-full px-4 py-1.5 glass border text-sm font-medium mb-6 backdrop-blur-md ${badgeStyles[badgeColor]}`}>
                    <span className="flex h-2 w-2 rounded-full mr-2 animate-pulse" />
                    {badge}
                </div>
                <h2 className="text-4xl font-heading font-bold text-white mb-4">{title}</h2>
                <p className="text-slate-400 max-w-xl mx-auto">{subtitle}</p>
            </div>
            {children}
        </section>
    );
}

function FeatureCard({
    icon: Icon,
    title,
    description,
    color,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    color: "neon-cyan" | "neon-purple" | "pink-400";
}) {
    const colorStyles = {
        "neon-cyan": { card: "group-hover:border-neon-cyan/50", icon: "text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10" },
        "neon-purple": { card: "group-hover:border-neon-purple/50", icon: "text-neon-purple border-neon-purple/30 bg-neon-purple/10" },
        "pink-400": { card: "group-hover:border-pink-500/50", icon: "text-pink-400 border-pink-400/30 bg-pink-400/10" },
    };
    return (
        <div className={`glass-card p-7 rounded-[1.75rem] transition-all group ${colorStyles[color].card}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 border ${colorStyles[color].icon}`}>
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-heading font-bold text-white mb-2">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
        </div>
    );
}

export default function SecurityPage() {
    const featureColors: Array<"neon-cyan" | "neon-purple" | "pink-400"> = ["neon-cyan", "neon-purple", "pink-400", "neon-cyan"];

    return (
        <div
            className="dark transition-none min-h-screen bg-[#0a0a0c] text-slate-200 relative overflow-hidden flex flex-col font-sans selection:bg-neon-cyan/30"
            style={{ colorScheme: "dark" }}
        >
            {/* Background blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] bg-pink-500/15 blur-[130px] rounded-full pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-neon-cyan/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none" />

            <LandingNav />

            <main className="flex-1 flex flex-col relative z-10">
                {/* ── Hero ── */}
                <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-28 max-w-5xl mx-auto w-full">
                    <div className="inline-flex items-center rounded-full px-4 py-1.5 glass border-pink-400/30 text-pink-400 text-sm font-medium mb-6 backdrop-blur-md shadow-[0_0_15px_rgba(236,72,153,0.15)]">
                        <span className="flex h-2 w-2 rounded-full bg-pink-400 mr-2 animate-pulse" />
                        Enterprise Security
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-heading font-extrabold tracking-tight text-white leading-[1.1] mb-6">
                        Enterprise-Grade
                        <br className="hidden lg:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-neon-purple to-neon-cyan pb-2">
                            {" "}Security & Protection
                        </span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light mb-10">
                        Zembaa is built security-first. Firebase Auth, RBAC, end-to-end encryption, dual-layer audit logging, and GCP-grade infrastructure protect your academic data at every layer.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/login"
                            className="px-8 py-4 rounded-full bg-gradient-to-r from-pink-500 to-neon-purple text-white text-lg font-bold hover:opacity-90 transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(236,72,153,0.4)] flex items-center justify-center gap-2"
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

                    {/* Security badges */}
                    <div className="flex flex-wrap justify-center gap-3 mt-12">
                        {[
                            "Firebase Auth",
                            "JWT RBAC",
                            "HTTPS/TLS",
                            "GCP IAM",
                            "Dual Audit Logs",
                            "2-Step Reset Verification",
                        ].map((badge) => (
                            <span key={badge} className="px-3 py-1.5 rounded-full glass border-white/10 text-slate-300 text-xs font-medium">
                                ✓ {badge}
                            </span>
                        ))}
                    </div>
                </section>

                {/* ── Auth & Authorization ── */}
                <SecuritySection
                    id="authentication"
                    badge="Identity & Access"
                    badgeColor="neon-cyan"
                    title="Authentication & Authorization"
                    subtitle="Every user, every request, every resource — protected by cryptographic identity management."
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {authFeatures.map((f, i) => (
                            <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} color={featureColors[i]} />
                        ))}
                    </div>
                </SecuritySection>

                {/* ── Data Protection ── */}
                <SecuritySection
                    id="data-protection"
                    badge="Data Security"
                    badgeColor="neon-purple"
                    title="Data Protection"
                    subtitle="Your data is encrypted in transit, isolated per tenant, and never exposed through client-side code."
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {dataProtectionFeatures.map((f, i) => (
                            <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} color={featureColors[i]} />
                        ))}
                    </div>
                </SecuritySection>

                {/* ── Audit & Logging ── */}
                <SecuritySection
                    id="audit"
                    badge="Audit & Compliance"
                    badgeColor="pink-400"
                    title="Audit & Logging"
                    subtitle="Every action is recorded. Full traceability for administrators, auditors, and compliance teams."
                >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {auditFeatures.map((f, i) => (
                            <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} color={featureColors[i]} />
                        ))}
                    </div>
                </SecuritySection>

                {/* ── Factory Reset & Backup ── */}
                <SecuritySection
                    id="factory-reset"
                    badge="Backup & Recovery"
                    badgeColor="neon-cyan"
                    title="Factory Reset & Backup Security"
                    subtitle="Destructive operations are gated behind multi-step verification and role restrictions."
                >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {resetFeatures.map((f, i) => (
                            <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} color={featureColors[i]} />
                        ))}
                    </div>
                </SecuritySection>

                {/* ── Cloud Readiness ── */}
                <SecuritySection
                    id="cloud"
                    badge="Cloud Infrastructure"
                    badgeColor="neon-purple"
                    title="Cloud-Ready on GCP"
                    subtitle="Designed for production-grade cloud deployment on Google Cloud Platform."
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {cloudFeatures.map((f, i) => (
                            <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} color={featureColors[i]} />
                        ))}
                    </div>
                </SecuritySection>

                {/* ── Compliance ── */}
                <section className="px-6 lg:px-12 pb-28 max-w-6xl mx-auto w-full">
                    <div className="glass-card rounded-[2rem] p-10 border-neon-cyan/15 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-purple/5 pointer-events-none" />
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-heading font-bold text-white mb-3">Compliance-Ready by Design</h2>
                            <p className="text-slate-400 max-w-xl mx-auto">Zembaa's architecture is built with data integrity, resilience, and audit-readiness as core principles — not afterthoughts.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {complianceItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.text} className="flex items-start gap-3 text-slate-300 text-sm">
                                        <Icon className="w-5 h-5 shrink-0 mt-0.5 text-neon-cyan" />
                                        {item.text}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ── CTA ── */}
                <section className="px-6 pb-28 flex flex-col items-center text-center max-w-3xl mx-auto w-full">
                    <div className="glass-card rounded-[2rem] p-12 border-pink-400/20 w-full relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-neon-cyan/5 pointer-events-none" />
                        <LuShieldCheck className="w-12 h-12 text-pink-400 mx-auto mb-6" />
                        <h2 className="text-3xl lg:text-4xl font-heading font-bold text-white mb-4">
                            Your Data. Fully Protected.
                        </h2>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            Deploy Zembaa with confidence. Enterprise authentication, isolated data partitions, and full audit logs ensure your institution's data stays safe, always.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/login"
                                className="px-8 py-4 rounded-full bg-gradient-to-r from-pink-500 to-neon-purple text-white text-lg font-bold hover:opacity-90 transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(236,72,153,0.4)] flex items-center justify-center gap-2"
                            >
                                Get Started <LuArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/solutions"
                                className="px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-lg font-semibold transition-all flex items-center justify-center gap-2"
                            >
                                View Solutions
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <LandingFooter />
        </div>
    );
}
