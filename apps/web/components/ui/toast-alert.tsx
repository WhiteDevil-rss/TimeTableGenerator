'use client';

import { useState, useCallback, useEffect } from 'react';
import { LuCircleCheck, LuCircleX, LuInfo, LuX } from 'react-icons/lu';

export type ToastType = 'success' | 'error' | 'info';

export type ToastState = {
    show: boolean;
    type: ToastType;
    message: string;
};

const icons = {
    success: <LuCircleCheck className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <LuCircleX className="w-5 h-5 text-red-500 shrink-0" />,
    info: <LuInfo className="w-5 h-5 text-blue-500 shrink-0" />,
};

const styles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    error: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
};

// ── Toast display component ───────────────────────────────────────────────────
export function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
    useEffect(() => {
        if (!toast.show) return;
        // Auto-dismiss after 4s
        const t = setTimeout(onClose, 4000);
        return () => clearTimeout(t);
    }, [toast.show, onClose]);

    if (!toast.show) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-2 fade-in duration-300">
            <div className={`flex items-start gap-3 rounded-xl border shadow-lg px-4 py-3 min-w-[300px] max-w-sm ${styles[toast.type]}`}>
                {icons[toast.type]}
                <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
                <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                    <LuX className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

// ── useToast hook ─────────────────────────────────────────────────────────────
// Usage:
//   const { toast, showToast, hideToast } = useToast();
//   showToast('success', 'Saved successfully!');
//   <Toast toast={toast} onClose={hideToast} />
export function useToast() {
    const [toast, setToast] = useState<ToastState>({ show: false, type: 'success', message: '' });
    const hideToast = useCallback(() => setToast(t => ({ ...t, show: false })), []);
    const showToast = useCallback((type: ToastType, message: string) => {
        setToast({ show: true, type, message });
    }, []);
    return { toast, showToast, hideToast };
}
