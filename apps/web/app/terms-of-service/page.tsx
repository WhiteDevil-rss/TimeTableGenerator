"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-background text-text-primary font-sans relative">
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />

            <nav className="sticky top-0 z-50 px-4 py-3 glass-morphism border-b border-white/5">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-white">auto_awesome</span>
                        </div>
                        <span className="font-heading font-bold text-lg">Zembaa AI</span>
                    </Link>
                    <Link href="/">
                        <button className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Home
                        </button>
                    </Link>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-20 relative z-10">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                    <h1 className="text-5xl font-heading font-bold mb-6">Terms of <span className="text-primary">Service</span></h1>
                    <p className="text-slate-400">Effective Date: March 2026</p>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="prose prose-invert prose-lg max-w-none text-slate-300">
                    <p>Welcome to Zembaa AI. These Terms of Service legally bind you regarding your interactions with our scheduling engines and software ecosystem.</p>

                    <h2 className="text-white text-2xl font-bold mt-10 mb-4">1. Acceptance of Terms</h2>
                    <p>By accessing `zembaa.ai` and using our dashboard, you confirm your acceptance of these terms. If you act on behalf of an academic institution, you warrant that you maintain the authority to bind that institution.</p>

                    <h2 className="text-white text-2xl font-bold mt-10 mb-4">2. Permitted Use & Conduct</h2>
                    <p>You agree to use Zembaa AI solely for generating academic timetables and administrating departmental assets. You must not:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-6">
                        <li>Attempt to reverse-engineer the proprietary AI constraint engine.</li>
                        <li>Spam server calls or attempt DDOS attacks against the timetable generation APIs.</li>
                        <li>Upload malicious payloads disguised as Excel/CSV imports.</li>
                    </ul>

                    <h2 className="text-white text-2xl font-bold mt-10 mb-4">3. Subscription and Billing</h2>
                    <p>Premium features requiring exhaustive computational parallelization are billed per month or per annum. Late payments may result in immediate gating to read-only views for existing timetables.</p>

                    <h2 className="text-white text-2xl font-bold mt-10 mb-4">4. Limitation of Liability</h2>
                    <p>Zembaa AI provides algorithmic outputs 'as is'. While our model mitigates 99.9% of conflicts, the final responsibility of approving schedules before assigning real physical resources lies with the Institution.</p>
                </motion.div>
            </main>
        </div>
    );
}
