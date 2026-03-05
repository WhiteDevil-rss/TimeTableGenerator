"use client";

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';

function TiltWrapper({ children, className }: { children: React.ReactNode, className?: string }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            className={className}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateY,
                rotateX,
                transformStyle: "preserve-3d",
            }}
        >
            <div style={{ transform: "translateZ(50px)" }}>
                {children}
            </div>
        </motion.div>
    );
}

export default function RootLandingClient() {
    const [showDemo, setShowDemo] = useState(false);
    const [email, setEmail] = useState('');
    const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [subscribeMessage, setSubscribeMessage] = useState('');

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            setSubscribeStatus('error');
            setSubscribeMessage('Please enter a valid email address.');
            return;
        }

        setSubscribeStatus('loading');
        try {
            const res = await fetch('http://localhost:8000/v1/subscribers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();

            if (!res.ok) {
                setSubscribeStatus('error');
                setSubscribeMessage(data.error || 'Failed to subscribe');
            } else {
                setSubscribeStatus('success');
                setSubscribeMessage('Successfully subscribed! You will receive our latest updates.');
                setEmail('');
                setTimeout(() => setSubscribeStatus('idle'), 5000);
            }
        } catch (error) {
            setSubscribeStatus('error');
            setSubscribeMessage('Failed to connect to server.');
        }
    };

    return (
        <div className="min-h-screen bg-background text-text-primary font-sans relative">
            {/* Google Material Symbols Link */}
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />

            {/*  Navigation Header  */}
            <motion.nav
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="sticky top-0 z-50 px-4 py-3"
            >
                <div className="glass-morphism rounded-full px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-white text-xl">auto_awesome</span>
                        </div>
                        <span className="font-heading font-bold text-lg tracking-tight">Zembaa AI</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium">
                        <Link href="/" className="hover:text-primary transition-colors relative group">
                            Home
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                        </Link>
                        <Link href="/platform" className="hover:text-primary transition-colors relative group">
                            Platform
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                        </Link>
                        <Link href="/solutions" className="hover:text-primary transition-colors relative group">
                            Solutions
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                        </Link>
                        <Link href="/security" className="hover:text-primary transition-colors relative group">
                            Security
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/login" tabIndex={-1}>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="text-xs font-semibold px-3 py-1.5 border border-primary/30 rounded-full hover:bg-primary/10 transition-colors"
                            >
                                Log In
                            </motion.button>
                        </Link>
                        <Link href="/login" tabIndex={-1}>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="text-xs font-bold px-4 py-1.5 bg-gradient-to-r from-primary to-secondary text-white rounded-full shadow-lg glow-shadow-primary"
                            >
                                Start Free
                            </motion.button>
                        </Link>
                    </div>
                </div>
            </motion.nav>

            {/*  Hero Section  */}
            <header className="relative px-6 pt-10 pb-16 overflow-hidden min-h-[90vh] flex flex-col justify-center">
                <div className="absolute top-[-10%] right-[-20%] w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[0%] left-[-20%] w-[400px] h-[400px] bg-secondary/10 blur-[100px] rounded-full"></div>
                <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
                    >
                        <span className="material-symbols-outlined text-primary text-sm">bolt</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">AI-Powered Scheduling Platform</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="font-heading text-5xl md:text-7xl font-bold leading-tight mb-6 tracking-tight"
                    >
                        The Future of Academic <span className="gradient-text">Timetable</span> Generation
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="text-text-secondary text-lg md:text-xl mb-10 max-w-2xl"
                    >
                        Create conflict-free, optimized timetables in seconds with our intelligent scheduling engine. Powered by advanced AI and constraint optimization.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="flex flex-col sm:flex-row w-full max-w-md gap-4 px-4"
                    >
                        <Link href="/login" className="flex-1 w-full" tabIndex={-1}>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full py-4 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg shadow-xl glow-shadow-primary transition-transform"
                            >
                                Get Started Free
                            </motion.button>
                        </Link>
                        <motion.button
                            onClick={() => setShowDemo(true)}
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 py-4 rounded-full border border-border bg-white/5 font-semibold text-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            <span className="material-symbols-outlined">play_circle</span>
                            Watch Demo
                        </motion.button>
                    </motion.div>

                    <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm font-medium text-text-muted animate-fade-in delay-500">
                        <span className="flex items-center gap-1">✓ 50+ Universities</span>
                        <span className="flex items-center gap-1">✓ 500+ Timetables</span>
                        <span className="flex items-center gap-1">✓ 99.9% Conflict-Free</span>
                    </div>
                </div>

                {/*  Floating Dashboard Mockup  */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="mt-20 relative max-w-5xl mx-auto w-full px-4 perspective-1000"
                >
                    <TiltWrapper className="w-full">
                        <div className="glass-morphism rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border border-primary/20 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl">
                            <div className="bg-[#0A0A1A]/90 rounded-xl p-8 h-[400px] flex flex-col gap-6 relative shadow-inner">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex gap-4 items-center">
                                        <div className="h-3 w-32 bg-slate-800 rounded-full"></div>
                                        <div className="h-3 w-16 bg-slate-800 rounded-full opacity-50"></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-3 w-3 bg-accent-red rounded-full"></div>
                                        <div className="h-3 w-3 bg-accent-yellow rounded-full"></div>
                                        <div className="h-3 w-3 bg-accent-green rounded-full"></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-5 gap-4 h-full">
                                    {[...Array(20)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                                            className={`rounded-lg border border-white/5 p-2 ${i % 7 === 0 ? 'bg-primary/20 border-primary/30' : i % 11 === 0 ? 'bg-secondary/20 border-secondary/30' : 'bg-white/5'}`}
                                        >
                                            {i % 7 === 0 && <div className="h-full w-full opacity-50 animate-pulse"></div>}
                                        </motion.div>
                                    ))}
                                </div>

                                {/*  Floating Element  */}
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass-morphism p-6 rounded-2xl shadow-[0_0_30px_rgba(0,245,255,0.2)] border border-primary/40"
                                    style={{ transform: "translateZ(30px)" }}
                                >
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-primary text-4xl">verified</span>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-xl uppercase tracking-tighter text-white">AI Optimization Complete</p>
                                            <p className="text-secondary font-medium">1,248 Conflicts Resolved</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </TiltWrapper>
                </motion.div>
            </header>

            {/*  Stats Section  */}
            <section className="px-6 py-20 bg-surface/30">
                <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="glass-morphism p-8 rounded-2xl text-center border-white/5 hover:border-primary/20 transition-colors">
                        <p className="gradient-text text-5xl font-heading font-bold mb-2">150+</p>
                        <p className="text-sm text-text-muted font-bold uppercase tracking-widest">Universities</p>
                    </div>
                    <div className="glass-morphism p-8 rounded-2xl text-center border-white/5 hover:border-secondary/20 transition-colors">
                        <p className="gradient-text text-5xl font-heading font-bold mb-2">500+</p>
                        <p className="text-sm text-text-muted font-bold uppercase tracking-widest">Timetables</p>
                    </div>
                    <div className="glass-morphism p-8 rounded-2xl text-center border-white/5 hover:border-accent-red/20 transition-colors">
                        <p className="gradient-text text-5xl font-heading font-bold mb-2">1000+</p>
                        <p className="text-sm text-text-muted font-bold uppercase tracking-widest">Faculty Members</p>
                    </div>
                    <div className="glass-morphism p-8 rounded-2xl text-center border-white/5 hover:border-accent-green/20 transition-colors">
                        <p className="gradient-text text-5xl font-heading font-bold mb-2">99.9%</p>
                        <p className="text-sm text-text-muted font-bold uppercase tracking-widest">Conflict-Free</p>
                    </div>
                </div>
            </section>

            {/*  Features Section  */}
            <section className="px-6 py-32 max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6">Powerful Features</h2>
                    <p className="text-text-secondary text-lg max-w-2xl mx-auto">Everything you need for intelligent academic scheduling, powered by cutting-edge AI technology.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: "AI Generation", desc: "Advanced AI generates optimized schedules automatically based on billions of data points.", icon: "auto_fix_high", color: "primary" },
                        { title: "Zero Conflicts", desc: "Guaranteed conflict-free scheduling for all resources across the entire institution.", icon: "gpp_good", color: "secondary" },
                        { title: "Smart Constraints", desc: "Intelligent handling of complex academic requirements and preferences.", icon: "settings_input_component", color: "accent-red" },
                        { title: "Multi-Program", desc: "Support for multiple programs, divisions, and semesters in a single platform.", icon: "domain", color: "accent-yellow" },
                        { title: "Elective Management", desc: "Smart basket-based elective scheduling with intelligent student splits.", icon: "menu_book", color: "primary" },
                        { title: "Resource Opt.", desc: "Maximum utilization of rooms, labs, and time slots throughout the week.", icon: "bolt", color: "secondary" },
                        { title: "Real-time Sync", desc: "Instant updates and synchronization across all department calendars.", icon: "sync", color: "accent-red" },
                        { title: "Continuous Flow", desc: "Gap-free timetables for a significantly better student and faculty experience.", icon: "hourglass_empty", color: "accent-yellow" },
                    ].map((f, i) => (
                        <div key={i} className="glass-card p-8 rounded-3xl group relative overflow-hidden h-full">
                            <div className={`absolute -right-4 -bottom-4 w-32 h-32 bg-${f.color}/10 rounded-full group-hover:scale-150 transition-transform duration-500`}></div>
                            <div className={`w-16 h-16 rounded-2xl bg-${f.color}/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                <span className={`material-symbols-outlined text-${f.color} text-4xl`}>{f.icon}</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                            <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/*  How It Works Section  */}
            <section className="px-6 py-32 bg-surface/20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24">
                        <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6">How It Works</h2>
                        <p className="text-text-secondary text-lg">Simple, automated, and powerful scheduling workflow.</p>
                    </div>
                    <div className="relative max-w-4xl mx-auto">
                        <div className="absolute left-[39px] md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-secondary to-accent-red opacity-30"></div>

                        {[
                            { num: 1, title: "Setup Your Institution", desc: "Configure your university structure, departments, and programs with ease.", icon: "apartment" },
                            { num: 2, title: "Input Academic Data", desc: "Upload course lists, faculty preferences, room capacities, and time slots.", icon: "upload_file" },
                            { num: 3, title: "Define Constraints", desc: "Set academic rules, elective baskets, and specific scheduling requirements.", icon: "rule" },
                            { num: 4, title: "Generate & Optimize", desc: "AI creates millions of combinations to find the perfect conflict-free output.", icon: "precision_manufacturing" },
                            { num: 5, title: "Review & Deploy", desc: "Make final adjustments, export, and publish to all stakeholders instantly.", icon: "task_alt" },
                        ].map((s, i) => (
                            <div key={i} className={`flex flex-col md:flex-row items-center gap-12 mb-20 last:mb-0 ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                                <div className="flex-1 text-center md:text-right">
                                    {i % 2 === 0 && (
                                        <div className="animate-fade-in">
                                            <h4 className="text-2xl font-bold mb-3">{s.title}</h4>
                                            <p className="text-text-secondary">{s.desc}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="relative z-10 w-20 h-20 rounded-full bg-surface border-4 border-background flex items-center justify-center shadow-glow">
                                    <span className="material-symbols-outlined text-primary text-3xl font-bold">{s.icon}</span>
                                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary text-white text-xs font-bold flex items-center justify-center shadow-lg">{s.num}</div>
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    {i % 2 === 1 && (
                                        <div className="animate-fade-in">
                                            <h4 className="text-2xl font-bold mb-3">{s.title}</h4>
                                            <p className="text-text-secondary">{s.desc}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/*  CTA Section  */}
            <section className="px-6 py-32">
                <div className="max-w-6xl mx-auto rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden bg-gradient-to-br from-[#1A1A3E] to-[#0A0A1A] border border-white/5 shadow-2xl">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 blur-[120px] rounded-full"></div>
                    <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary/10 blur-[120px] rounded-full"></div>
                    <div className="relative z-10 max-w-3xl mx-auto">
                        <h2 className="font-heading text-4xl md:text-6xl font-bold mb-8">Ready to Transform Your Academic Scheduling?</h2>
                        <p className="text-text-secondary text-xl mb-12">Join 150+ leading institutions that have optimized their operations with our AI platform.</p>
                        <div className="flex flex-col sm:flex-row justify-center gap-6">
                            <Link href="/login" tabIndex={-1}>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-full px-10 py-5 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-bold text-xl shadow-2xl glow-shadow-primary transition-transform"
                                >
                                    Get Started Free
                                </motion.button>
                            </Link>
                            <motion.button
                                onClick={() => alert('Demo scheduling placeholder')}
                                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full px-10 py-5 rounded-full border border-border bg-white/5 font-semibold text-xl transition-colors"
                            >
                                Schedule a Demo
                            </motion.button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Newsletter Subscription */}
            <section className="py-24 px-6 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-full bg-primary/10 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                        className="glass-morphism rounded-3xl p-10 md:p-14 border border-white/10 shadow-2xl relative overflow-hidden"
                    >
                        {/* Decorative glow */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/30 blur-3xl rounded-full"></div>

                        <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4 text-white">Join Our Newsletter</h2>
                        <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">
                            Subscribe to get the latest updates on AI features, new scheduling capabilities, and exclusive early access to Zembaa v3.0.
                        </p>

                        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                disabled={subscribeStatus === 'loading'}
                                className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                required
                            />
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={subscribeStatus === 'loading'}
                                type="submit"
                                className="bg-gradient-to-r from-primary to-secondary text-white font-bold px-8 py-4 rounded-full shadow-lg glow-shadow-primary disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                {subscribeStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}
                            </motion.button>
                        </form>

                        <AnimatePresence>
                            {subscribeMessage && (
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className={`mt-4 text-sm font-medium ${subscribeStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}
                                >
                                    {subscribeMessage}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </section>

            {/*  Footer  */}
            <footer className="border-t border-white/5 pt-24 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
                        <div className="col-span-2 lg:col-span-2">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-2xl">auto_awesome</span>
                                </div>
                                <span className="font-heading font-bold text-2xl tracking-tighter">Zembaa AI</span>
                            </div>
                            <p className="text-text-muted text-sm max-w-xs mb-8">
                                Empowering academic institutions with intelligent AI-driven scheduling solutions to optimize learning journeys.
                            </p>
                            <div className="flex gap-4">
                                {['facebook', 'twitter', 'linkedin', 'github'].map(s => (
                                    <div key={s} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all cursor-pointer">
                                        <span className="material-symbols-outlined text-xl">{s === 'facebook' ? 'public' : s === 'twitter' ? 'share' : s === 'linkedin' ? 'group' : 'code'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h5 className="font-bold mb-6 text-primary uppercase text-xs tracking-widest">Platform</h5>
                            <ul className="space-y-4 text-sm text-text-muted">
                                <li><Link href="/platform" className="hover:text-white transition-colors">AI Engine</Link></li>
                                <li><a href="#" className="hover:text-white transition-colors">Constraint Manager</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Visual Reporting</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">API Access</a></li>
                            </ul>
                        </div>

                        <div>
                            <h5 className="font-bold mb-6 text-secondary uppercase text-xs tracking-widest">Solutions</h5>
                            <ul className="space-y-4 text-sm text-text-muted">
                                <li><Link href="/solutions" className="hover:text-white transition-colors">Universities</Link></li>
                                <li><a href="#" className="hover:text-white transition-colors">Medical Colleges</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">K-12 Schools</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Private Institutions</a></li>
                            </ul>
                        </div>

                        <div>
                            <h5 className="font-bold mb-6 text-accent-red uppercase text-xs tracking-widest">Company</h5>
                            <ul className="space-y-4 text-sm text-text-muted">
                                <li><Link href="/about-us" className="hover:text-white transition-colors">About Us</Link></li>
                                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                                <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
                                <li><Link href="/legal" className="hover:text-white transition-colors">Legal Hub</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-muted font-medium uppercase tracking-widest">
                        <p>© 2026 Zembaa AI Technologies. All Rights Reserved.</p>
                        <div className="flex gap-8">
                            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
                            <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms</Link>
                            <Link href="/security" className="hover:text-white transition-colors">Security</Link>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Video Modal */}
            <AnimatePresence>
                {showDemo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowDemo(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-[#0A0A1A] border border-white/10 rounded-2xl overflow-hidden w-full max-w-5xl shadow-2xl relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
                                <h3 className="text-white font-bold text-lg font-heading flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">play_circle</span>
                                    Zembaa AI Demo
                                </h3>
                                <button
                                    onClick={() => setShowDemo(false)}
                                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-white"
                                >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>

                            {/* Video Container */}
                            <div className="relative pt-[56.25%] bg-black w-full">
                                <iframe
                                    className="absolute inset-0 w-full h-full"
                                    src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                                    title="Zembaa AI Demonstration"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
