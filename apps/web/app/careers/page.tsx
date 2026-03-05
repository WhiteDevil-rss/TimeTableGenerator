"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const jobs = [
    { title: "Senior AI Engineer", department: "Engineering", location: "Remote", type: "Full-Time" },
    { title: "Product Designer", department: "Design", location: "New York, NY", type: "Full-Time" },
    { title: "Customer Success Manager", department: "Operations", location: "Remote", type: "Full-Time" }
];

export default function CareersPage() {
    const [selectedJob, setSelectedJob] = useState<string | null>(null);

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

            <main className="max-w-5xl mx-auto px-6 py-20 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-5xl font-heading font-bold mb-4">Join Our <span className="gradient-text">Team</span></h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        We're always looking for passionate people to help us revolutionize academic scheduling. Work from anywhere, impact everywhere.
                    </p>
                </motion.div>

                <div className="space-y-6 mb-20">
                    {jobs.map((job, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ scale: 1.01 }}
                            className="glass-morphism rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between border border-white/10 hover:border-primary/50 transition-colors cursor-pointer"
                            onClick={() => setSelectedJob(job.title)}
                        >
                            <div>
                                <h3 className="text-2xl font-bold mb-2 text-white">{job.title}</h3>
                                <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">work</span> {job.department}</span>
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">location_on</span> {job.location}</span>
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> {job.type}</span>
                                </div>
                            </div>
                            <div className="mt-4 md:mt-0">
                                <button className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-medium transition-colors text-white">
                                    Apply Now
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <AnimatePresence>
                    {selectedJob && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                            onClick={() => setSelectedJob(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="bg-[#0A0A1A] border border-white/10 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className="text-3xl font-bold text-white">Apply for {selectedJob}</h2>
                                    <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-white">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>

                                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Application Submitted Placeholder'); setSelectedJob(null); }}>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                                        <input type="text" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                                        <input type="email" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">LinkedIn Profile / Portfolio</label>
                                        <input type="url" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Cover Letter (Optional)</label>
                                        <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"></textarea>
                                    </div>
                                    <button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-4 rounded-xl mt-4">
                                        Submit Application
                                    </button>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </main>
        </div>
    );
}
