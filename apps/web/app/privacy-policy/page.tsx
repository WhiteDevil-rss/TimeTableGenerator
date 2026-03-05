"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function PrivacyPolicyPage() {
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
                    <h1 className="text-5xl font-heading font-bold mb-6">Privacy <span className="text-primary">Policy</span></h1>
                    <p className="text-slate-400">Last Updated: March 2026</p>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="prose prose-invert prose-lg max-w-none text-slate-300">
                    <p>At Zembaa AI, protecting your privacy and safeguarding your academic data is our highest priority. This Privacy Policy outlines how we collect, use, and store information through our timetable generation platform.</p>

                    <h2 className="text-white text-2xl font-bold mt-10 mb-4">1. Information We Collect</h2>
                    <p>We only collect data strictly necessary to provide and improve our services:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-6">
                        <li><strong>Account Data:</strong> Names, emails, and phone numbers for university administrators and staff using our portal.</li>
                        <li><strong>Institutional Data:</strong> Non-personal academic constraints, faculty names, course loads, and room capacities uploaded to correctly map your schedules.</li>
                        <li><strong>Usage Logs:</strong> System logs tracking IP addresses and browser configurations for security and audit trailing purposes.</li>
                    </ul>

                    <h2 className="text-white text-2xl font-bold mt-10 mb-4">2. Data Usage</h2>
                    <p>We process your data exclusively to:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-6">
                        <li>Compute and resolve timetable generation algorithms via our AI engine.</li>
                        <li>Maintain role-based access controls and secure endpoints for administrators.</li>
                        <li>Send automated notifications regarding service status or completed generation cycles.</li>
                    </ul>

                    <h2 className="text-white text-2xl font-bold mt-10 mb-4">3. Data Storage & Security</h2>
                    <p>Zembaa AI employs bank-grade security protocols. All data transmits via SSL/TLS encryption. Data is redundantly stored within sovereign data centers conforming to ISO27001 standards. We do not sell, rent, or trade institutional data to any third party entities.</p>

                    <h2 className="text-white text-2xl font-bold mt-10 mb-4">4. User Rights</h2>
                    <p>Under GDPR, CCPA, and associated privacy architectures, users retain full rights to request exports of their data, request structural deletions, or appeal algorithmic processing. Please channel legal compliance inquiries to <strong>legal@zembaa.ai</strong>.</p>
                </motion.div>
            </main>
        </div>
    );
}
