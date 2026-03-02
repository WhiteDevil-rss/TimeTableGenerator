'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import {
    LuMailOpen, LuSearch, LuDownload, LuTrash2, LuEye, LuChevronLeft,
    LuChevronRight, LuCircleAlert
} from 'react-icons/lu';
import { SUPERADMIN_NAV } from '@/lib/constants/nav-config';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog, useConfirm } from '@/components/ui/confirm-dialog';
import { Toast, useToast } from '@/components/ui/toast-alert';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Inquiry {
    id: string;
    name: string;
    email: string;
    contactNumber: string;
    organization?: string;
    message?: string;
    status: 'NEW' | 'CONTACTED' | 'CONVERTED';
    ipAddress?: string;
    createdAt: string;
    updatedAt: string;
}

interface PaginatedResponse {
    data: Inquiry[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
    NEW: 'New',
    CONTACTED: 'Contacted',
    CONVERTED: 'Converted',
};

const STATUS_NEXT: Record<string, string> = {
    NEW: 'CONTACTED',
    CONTACTED: 'CONVERTED',
    CONVERTED: 'NEW',
};

const STATUS_STYLES: Record<string, string> = {
    NEW: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    CONTACTED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    CONVERTED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

function StatusBadge({ status }: { status: string }) {
    return (
        <span className={cn(
            'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border',
            STATUS_STYLES[status] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
        )}>
            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
            {STATUS_LABELS[status] ?? status}
        </span>
    );
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SuperAdminInquiries() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [viewInquiry, setViewInquiry] = useState<Inquiry | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);

    const { confirmState, closeConfirm, askConfirm } = useConfirm();
    const { toast, showToast, hideToast } = useToast();

    // ── Fetch ─────────────────────────────────────────────────────────────────

    const fetchInquiries = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: '10',
                search: search.trim(),
                status: statusFilter,
            });
            const { data } = await api.get<PaginatedResponse>(`/inquiries?${params}`);
            setInquiries(data.data);
            setTotal(data.total);
            setTotalPages(data.totalPages);
        } catch {
            showToast('error', 'Failed to load inquiries.');
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter, showToast]);

    useEffect(() => {
        fetchInquiries();
    }, [fetchInquiries]);

    // Debounce search to avoid hitting API on every keystroke
    const [searchInput, setSearchInput] = useState('');
    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    // ── Actions ───────────────────────────────────────────────────────────────

    const handleCycleStatus = async (inquiry: Inquiry) => {
        const nextStatus = STATUS_NEXT[inquiry.status];
        setUpdatingId(inquiry.id);
        try {
            await api.patch(`/inquiries/${inquiry.id}/status`, { status: nextStatus });
            showToast('success', `Status updated to ${STATUS_LABELS[nextStatus]}.`);
            fetchInquiries();
        } catch {
            showToast('error', 'Failed to update status.');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = (id: string, name: string) => {
        askConfirm({
            title: 'Delete Inquiry',
            message: `Delete inquiry from "${name}"? This cannot be undone.`,
            requireTypedConfirm: true,
            onConfirm: async () => {
                try {
                    await api.delete(`/inquiries/${id}`);
                    showToast('success', 'Inquiry deleted.');
                    fetchInquiries();
                } catch {
                    showToast('error', 'Failed to delete inquiry.');
                }
            },
        });
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1';
            const token = (await import('@/lib/firebase')).auth.currentUser
                ? await (await import('@/lib/firebase')).auth.currentUser!.getIdToken()
                : null;

            const res = await fetch(`${apiUrl}/inquiries/export`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            if (!res.ok) throw new Error('Export failed');

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inquiries-${Date.now()}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            showToast('error', 'Failed to export Excel file.');
        } finally {
            setExporting(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <ProtectedRoute allowedRoles={['SUPERADMIN']}>
            <DashboardLayout navItems={SUPERADMIN_NAV} title="Inquiries">
                <ConfirmDialog state={confirmState} onClose={closeConfirm} />
                <Toast toast={toast} onClose={hideToast} />

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white glow-sm flex items-center gap-3">
                            <LuMailOpen className="w-7 h-7 text-neon-cyan" />
                            Inquiries
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Manage leads captured from the landing page. Total: <strong>{total}</strong>
                        </p>
                    </div>
                    <Button
                        onClick={handleExport}
                        disabled={exporting}
                        className="bg-neon-cyan text-slate-900 font-bold shadow-[0_0_15px_rgba(57,193,239,0.4)] hover:shadow-[0_0_25px_rgba(57,193,239,0.6)] transition-all flex items-center gap-2"
                    >
                        <LuDownload className={cn('w-4 h-4', exporting && 'animate-bounce')} />
                        {exporting ? 'Exporting…' : 'Export Excel'}
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            className="pl-9 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:border-neon-cyan/50 rounded-xl h-11"
                            placeholder="Search by name, email, org, phone…"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </div>
                    <select
                        className="h-11 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm font-semibold px-4 outline-none focus:border-neon-cyan/50 transition-all appearance-none cursor-pointer min-w-[150px]"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    >
                        <option value="">All Statuses</option>
                        <option value="NEW">New</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="CONVERTED">Converted</option>
                    </select>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center p-16">
                        <div className="w-8 h-8 rounded-full border-4 border-neon-cyan border-t-transparent animate-spin" />
                    </div>
                ) : (
                    <Card className="bg-white dark:bg-slate-900/40 border-slate-200 dark:border-white/5 backdrop-blur-md shadow-xl overflow-hidden rounded-2xl">
                        <CardHeader className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5 pb-6">
                            <CardTitle className="text-xl text-slate-900 dark:text-white">Lead Submissions</CardTitle>
                            <CardDescription className="text-slate-600 dark:text-slate-400">
                                All interest captured from the Zembaa landing page.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-white/5">
                                        <tr>
                                            <th className="px-6 py-5 font-bold tracking-wider">Contact</th>
                                            <th className="px-6 py-5 font-bold tracking-wider">Phone</th>
                                            <th className="px-6 py-5 font-bold tracking-wider">Organization</th>
                                            <th className="px-6 py-5 font-bold tracking-wider">Date Submitted</th>
                                            <th className="px-6 py-5 font-bold tracking-wider">Status</th>
                                            <th className="px-6 py-5 font-bold tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {inquiries.map((inq) => (
                                            <tr key={inq.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-neon-cyan transition-colors">
                                                        {inq.name}
                                                    </div>
                                                    <div className="text-slate-500 text-xs mt-0.5">{inq.email}</div>
                                                </td>
                                                <td className="px-6 py-5 text-slate-700 dark:text-slate-300 font-medium text-sm">
                                                    {inq.contactNumber}
                                                </td>
                                                <td className="px-6 py-5 text-slate-700 dark:text-slate-300 text-sm">
                                                    {inq.organization || <span className="text-slate-400 italic">—</span>}
                                                </td>
                                                <td className="px-6 py-5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                                                    {formatDate(inq.createdAt)}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <StatusBadge status={inq.status} />
                                                </td>
                                                <td className="px-6 py-5 text-right space-x-2 whitespace-nowrap">
                                                    {/* View */}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 rounded-xl font-bold"
                                                        onClick={() => setViewInquiry(inq)}
                                                    >
                                                        <LuEye className="w-3.5 h-3.5 mr-1" /> View
                                                    </Button>
                                                    {/* Cycle status */}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={updatingId === inq.id}
                                                        className="text-amber-400 hover:bg-amber-500/10 border border-amber-500/10 rounded-xl font-bold"
                                                        onClick={() => handleCycleStatus(inq)}
                                                    >
                                                        {updatingId === inq.id ? '…' : `→ ${STATUS_LABELS[STATUS_NEXT[inq.status]]}`}
                                                    </Button>
                                                    {/* Delete */}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-rose-400 hover:bg-rose-500/10 border border-rose-500/10 rounded-xl font-bold"
                                                        onClick={() => handleDelete(inq.id, inq.name)}
                                                    >
                                                        <LuTrash2 className="w-3.5 h-3.5 mr-1" /> Delete
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}

                                        {inquiries.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                                                    <LuCircleAlert className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                                    No inquiries found.
                                                    {search && <span className="block text-xs mt-1">Try clearing the search filter.</span>}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-white/5">
                                    <p className="text-xs text-slate-500">
                                        Page {page} of {totalPages} &nbsp;·&nbsp; {total} total
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={page <= 1}
                                            onClick={() => setPage((p) => p - 1)}
                                            className="rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 disabled:opacity-30"
                                        >
                                            <LuChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <span className="text-xs font-bold text-slate-700 dark:text-white px-2">{page}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={page >= totalPages}
                                            onClick={() => setPage((p) => p + 1)}
                                            className="rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 disabled:opacity-30"
                                        >
                                            <LuChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* View Detail Modal */}
                <Dialog open={!!viewInquiry} onOpenChange={(o) => !o && setViewInquiry(null)}>
                    <DialogContent className="sm:max-w-xl bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/5 shadow-2xl rounded-[2rem] p-0 overflow-hidden">
                        <DialogHeader className="p-8 pb-0">
                            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                <LuMailOpen className="w-6 h-6 text-neon-cyan" />
                                Inquiry Detail
                            </DialogTitle>
                        </DialogHeader>

                        {viewInquiry && (
                            <div className="p-8 space-y-5">
                                {[
                                    ['Full Name', viewInquiry.name],
                                    ['Email', viewInquiry.email],
                                    ['Phone', viewInquiry.contactNumber],
                                    ['Organization', viewInquiry.organization || '—'],
                                    ['Status', null],      // rendered separately
                                    ['Submitted', formatDate(viewInquiry.createdAt)],
                                    ['IP Address', viewInquiry.ipAddress || '—'],
                                ].map(([label, value]) => (
                                    <div key={label as string}>
                                        <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">{label}</p>
                                        {label === 'Status' ? (
                                            <StatusBadge status={viewInquiry.status} />
                                        ) : (
                                            <p className="text-slate-900 dark:text-white font-medium">{value}</p>
                                        )}
                                    </div>
                                ))}

                                {viewInquiry.message && (
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Message</p>
                                        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-slate-800 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                            {viewInquiry.message}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setViewInquiry(null)}
                                        className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl px-6 h-11 font-bold"
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        disabled={updatingId === viewInquiry.id}
                                        className="bg-neon-cyan text-slate-900 font-black rounded-xl px-6 h-11 shadow-[0_0_20px_rgba(57,193,239,0.3)]"
                                        onClick={async () => {
                                            await handleCycleStatus(viewInquiry);
                                            setViewInquiry(null);
                                        }}
                                    >
                                        → Set {STATUS_LABELS[STATUS_NEXT[viewInquiry.status]]}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

            </DashboardLayout>
        </ProtectedRoute>
    );
}
