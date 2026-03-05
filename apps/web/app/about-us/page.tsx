"use client";

import React from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

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

export default function AboutUsPage() {
    return (
        <div className="min-h-screen bg-background text-text-primary font-sans relative">
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />

            {/* Nav Header */}
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

            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-20%] w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[20%] left-[-20%] w-[400px] h-[400px] bg-secondary/10 blur-[100px] rounded-full"></div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-24 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-24"
                >
                    <h1 className="text-5xl md:text-7xl font-heading font-bold mb-6">Our <span className="gradient-text">Story</span></h1>
                    <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                        We believe that technology should empower educators, not restrain them. Zembaa AI was founded with a singular mission: to eradicate the nightmare of manual academic scheduling.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-16 mb-24 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <TiltWrapper>
                            <div className="glass-morphism rounded-3xl p-8 border border-white/10 shadow-2xl relative">
                                <span className="material-symbols-outlined text-6xl text-primary mb-6">visibility</span>
                                <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
                                <p className="text-slate-400 text-lg leading-relaxed">
                                    To become the globally recognized standard for institutional constraint optimization. We envision a world where academic resources—time, professors, and spaces—are hyper-optimized automatically.
                                </p>
                            </div>
                        </TiltWrapper>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <TiltWrapper>
                            <div className="glass-morphism rounded-3xl p-8 border border-white/10 shadow-2xl relative">
                                <span className="material-symbols-outlined text-6xl text-secondary mb-6">rocket_launch</span>
                                <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                                <p className="text-slate-400 text-lg leading-relaxed">
                                    To build the fastest, most infallible AI scheduling engine that respects human constraints and complex university rules, giving back millions of hours to academic administrators globally.
                                </p>
                            </div>
                        </TiltWrapper>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center"
                >
                    <h2 className="text-4xl font-heading font-bold mb-12">Meet the <span className="text-primary">Team</span></h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                        {[
                            { name: 'Alex Johnson', role: 'CEO & Founder', icon: 'person' },
                            { name: 'Sarah Chen', role: 'Chief AI Engineer', icon: 'smart_toy' },
                            { name: 'Marcus Do', role: 'Head of Product', icon: 'architecture' }
                        ].map((member, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="glass-morphism rounded-2xl p-6 border border-white/5 hover:border-primary/50 transition-colors"
                            >
                                <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-3xl text-white/50">{member.icon}</span>
                                </div>
                                <h3 className="text-xl font-bold">{member.name}</h3>
                                <p className="text-primary text-sm font-medium">{member.role}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
