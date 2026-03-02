'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LuX, LuLoader, LuCircleCheck, LuCircleAlert, LuCalendar } from 'react-icons/lu';

interface GetStartedModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface FormState {
    name: string;
    email: string;
    contactNumber: string;
    organization: string;
    message: string;
}

interface FormErrors {
    name?: string;
    email?: string;
    contactNumber?: string;
}

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d\s+\-()]{7,20}$/;

function validate(form: FormState): FormErrors {
    const errors: FormErrors = {};
    if (!form.name.trim()) errors.name = 'Full name is required.';
    if (!form.email.trim()) {
        errors.email = 'Email is required.';
    } else if (!EMAIL_RE.test(form.email.trim())) {
        errors.email = 'Enter a valid email address.';
    }
    if (!form.contactNumber.trim()) {
        errors.contactNumber = 'Contact number is required.';
    } else if (!PHONE_RE.test(form.contactNumber.trim())) {
        errors.contactNumber = 'Enter a valid phone number (7–20 digits).';
    }
    return errors;
}

export function GetStartedModal({ isOpen, onClose }: GetStartedModalProps) {
    const [form, setForm] = useState<FormState>({
        name: '',
        email: '',
        contactNumber: '',
        organization: '',
        message: '',
    });
    const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
    const [status, setStatus] = useState<SubmitStatus>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [spamLock, setSpamLock] = useState(false);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const errors = validate(form);
    const isValid = Object.keys(errors).length === 0;

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && status !== 'loading') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, status, onClose]);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setForm({ name: '', email: '', contactNumber: '', organization: '', message: '' });
            setTouched({});
            setStatus('idle');
            setErrorMessage('');
        }
        return () => {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        };
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleBlur = (field: keyof FormState) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid || spamLock) return;

        // Touch all required fields to show errors
        setTouched({ name: true, email: true, contactNumber: true });
        if (!isValid) return;

        setStatus('loading');
        setErrorMessage('');

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1';
            const response = await fetch(`${apiUrl}/inquiries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name.trim(),
                    email: form.email.trim().toLowerCase(),
                    contactNumber: form.contactNumber.trim(),
                    organization: form.organization.trim() || undefined,
                    message: form.message.trim() || undefined,
                }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || 'Submission failed. Please try again.');
            }

            setStatus('success');
            setSpamLock(true);

            // Auto-close after 3 s
            closeTimerRef.current = setTimeout(() => {
                onClose();
                setStatus('idle');
                setSpamLock(false);
            }, 3000);
        } catch (err: unknown) {
            setStatus('error');
            setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        }
    };

    if (!isOpen) return null;

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            aria-modal="true"
            role="dialog"
        >
            {/* Dim overlay */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={status !== 'loading' ? onClose : undefined}
            />

            {/* Modal card */}
            <div className="relative z-10 w-full max-w-lg bg-[#0d0f14] border border-white/10 rounded-[2rem] shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-300">

                {/* Glow accents */}
                <div className="absolute top-[-30%] right-[-20%] w-[50%] h-[50%] bg-neon-cyan/15 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-neon-purple/15 blur-[80px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="relative flex items-center justify-between px-8 pt-8 pb-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
                            <LuCalendar className="w-5 h-5 text-neon-cyan" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight">Get Started</h2>
                            <p className="text-xs text-slate-500 font-medium">We'll reach out within 24 hours</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={status === 'loading'}
                        className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all disabled:opacity-50"
                        aria-label="Close modal"
                    >
                        <LuX className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                {status === 'success' ? (
                    // ── Success State ──
                    <div className="relative flex flex-col items-center justify-center gap-4 px-8 py-14 text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-2">
                            <LuCircleCheck className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-black text-white">Thanks! We'll be in touch.</h3>
                        <p className="text-slate-400 text-sm max-w-xs">
                            Your inquiry has been received. Our team will contact you within 24 hours.
                        </p>
                        <p className="text-slate-600 text-xs mt-2">This window will close automatically…</p>
                    </div>
                ) : (
                    // ── Form ──
                    <form onSubmit={handleSubmit} noValidate className="relative px-8 pt-6 pb-8 space-y-5">

                        {/* Error banner */}
                        {status === 'error' && (
                            <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                                <LuCircleAlert className="w-4 h-4 text-rose-400 shrink-0" />
                                <p className="text-rose-300 text-sm font-medium">{errorMessage}</p>
                            </div>
                        )}

                        {/* Row 1: Name */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-0.5">
                                Full Name <span className="text-rose-400">*</span>
                            </label>
                            <input
                                name="name"
                                type="text"
                                autoComplete="name"
                                value={form.name}
                                onChange={handleChange}
                                onBlur={() => handleBlur('name')}
                                placeholder="Dr. Amelia Watson"
                                className={`w-full h-12 rounded-xl bg-white/5 border px-4 text-sm text-white font-medium placeholder-slate-600 outline-none transition-all focus:ring-1
                  ${touched.name && errors.name
                                        ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20'
                                        : 'border-white/10 focus:border-neon-cyan/50 focus:ring-neon-cyan/10'
                                    }`}
                            />
                            {touched.name && errors.name && (
                                <p className="text-rose-400 text-xs ml-0.5">{errors.name}</p>
                            )}
                        </div>

                        {/* Row 2: Email + Phone */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-0.5">
                                    Email <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    onBlur={() => handleBlur('email')}
                                    placeholder="you@university.edu"
                                    className={`w-full h-12 rounded-xl bg-white/5 border px-4 text-sm text-white font-medium placeholder-slate-600 outline-none transition-all focus:ring-1
                    ${touched.email && errors.email
                                            ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-white/10 focus:border-neon-cyan/50 focus:ring-neon-cyan/10'
                                        }`}
                                />
                                {touched.email && errors.email && (
                                    <p className="text-rose-400 text-xs ml-0.5">{errors.email}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-0.5">
                                    Phone <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    name="contactNumber"
                                    type="tel"
                                    autoComplete="tel"
                                    value={form.contactNumber}
                                    onChange={handleChange}
                                    onBlur={() => handleBlur('contactNumber')}
                                    placeholder="+91 98765 43210"
                                    className={`w-full h-12 rounded-xl bg-white/5 border px-4 text-sm text-white font-medium placeholder-slate-600 outline-none transition-all focus:ring-1
                    ${touched.contactNumber && errors.contactNumber
                                            ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-white/10 focus:border-neon-cyan/50 focus:ring-neon-cyan/10'
                                        }`}
                                />
                                {touched.contactNumber && errors.contactNumber && (
                                    <p className="text-rose-400 text-xs ml-0.5">{errors.contactNumber}</p>
                                )}
                            </div>
                        </div>

                        {/* Row 3: Organization */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-0.5">
                                Organization / University <span className="text-slate-700 font-normal tracking-normal normal-case">(optional)</span>
                            </label>
                            <input
                                name="organization"
                                type="text"
                                value={form.organization}
                                onChange={handleChange}
                                placeholder="Gujarat University, VNSGU…"
                                className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-sm text-white font-medium placeholder-slate-600 outline-none transition-all focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/10"
                            />
                        </div>

                        {/* Row 4: Message */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-0.5">
                                Message <span className="text-slate-700 font-normal tracking-normal normal-case">(optional)</span>
                            </label>
                            <textarea
                                name="message"
                                value={form.message}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Tell us about your scheduling needs…"
                                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white font-medium placeholder-slate-600 outline-none transition-all focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/10 resize-none"
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={!isValid || status === 'loading' || spamLock}
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-neon-cyan to-blue-500 text-slate-900 text-sm font-black tracking-wide
                shadow-[0_0_20px_rgba(57,193,239,0.3)] hover:shadow-[0_0_30px_rgba(57,193,239,0.5)]
                disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                transition-all flex items-center justify-center gap-2"
                        >
                            {status === 'loading' ? (
                                <>
                                    <LuLoader className="w-4 h-4 animate-spin" />
                                    Submitting…
                                </>
                            ) : (
                                'Submit Inquiry →'
                            )}
                        </button>

                        <p className="text-center text-[10px] text-slate-600">
                            By submitting you agree to be contacted by the Zembaa team. No spam, ever.
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
