'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LuTriangleAlert } from 'react-icons/lu';

// ── ConfirmDialog (controlled) ────────────────────────────────────────────────
export type ConfirmState = {
    open: boolean;
    title: string;
    message: string;
    danger?: boolean;
    confirmLabel?: string;
    onConfirm: () => void;
};

export const emptyConfirm: ConfirmState = {
    open: false,
    title: '',
    message: '',
    danger: true,
    confirmLabel: 'Delete',
    onConfirm: () => { },
};

export function ConfirmDialog({
    state,
    onClose,
}: {
    state: ConfirmState;
    onClose: () => void;
}) {
    return (
        <Dialog open={state.open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className={`flex items-center gap-2 ${state.danger !== false ? 'text-red-600' : 'text-slate-800'}`}>
                        <LuTriangleAlert className="w-5 h-5 shrink-0" />
                        {state.title}
                    </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-slate-600 py-2 leading-relaxed">{state.message}</p>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button
                        className={state.danger !== false ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                        onClick={() => { state.onConfirm(); onClose(); }}
                    >
                        {state.confirmLabel ?? 'Confirm'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── useConfirm hook ────────────────────────────────────────────────────────────
// Usage:
//   const { confirmState, closeConfirm, askConfirm } = useConfirm();
//   askConfirm({ title: 'Delete?', message: '…', onConfirm: () => doDelete() });
//   <ConfirmDialog state={confirmState} onClose={closeConfirm} />
export function useConfirm() {
    const [confirmState, setConfirmState] = useState<ConfirmState>(emptyConfirm);
    const closeConfirm = useCallback(() => setConfirmState(emptyConfirm), []);
    const askConfirm = useCallback((opts: Omit<ConfirmState, 'open'>) => {
        setConfirmState({ open: true, ...opts });
    }, []);
    return { confirmState, closeConfirm, askConfirm };
}
