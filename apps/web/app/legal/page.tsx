"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LegalPage() {
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
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
                    <h1 className="text-5xl font-heading font-bold mb-6">Legal <span className="text-primary">Hub</span></h1>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                        Transparency is our top priority. Review our policies and legal resources regarding how we protect your educational institution's data.
                    </p>
                </motion.div>

                <div className="grid sm:grid-cols-2 gap-8 mt-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Link href="/privacy-policy" className="block p-8 border border-white/10 rounded-3xl glass-morphism hover:border-primary/50 transition-all group">
                            <span className="material-symbols-outlined text-4xl text-primary mb-4 block group-hover:scale-110 transition-transform">shield</span>
                            <h2 className="text-2xl font-bold mb-2">Privacy Policy</h2>
                            <p className="text-slate-400 text-sm">Read exactly how we collect, store, and secure your institutional constraints and data schemas safely.</p>
                            <span className="text-primary text-sm font-medium mt-6 flex items-center gap-1 group-hover:gap-2 transition-all">
                                Read Policy <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </span>
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Link href="/terms-of-service" className="block p-8 border border-white/10 rounded-3xl glass-morphism hover:border-secondary/50 transition-all group">
                            <span className="material-symbols-outlined text-4xl text-secondary mb-4 block group-hover:scale-110 transition-transform">gavel</span>
                            <h2 className="text-2xl font-bold mb-2">Terms of Service</h2>
                            <p className="text-slate-400 text-sm">Review our general rules, disclaimers, and user conduct guidelines for interacting with our AI platform.</p>
                            <span className="text-secondary text-sm font-medium mt-6 flex items-center gap-1 group-hover:gap-2 transition-all">
                                Read Terms <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </span>
                        </Link>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
