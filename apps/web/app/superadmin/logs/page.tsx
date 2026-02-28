'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import {
    LuLayoutDashboard, LuBuilding2, LuUsers, LuClipboardList,
    LuSearch, LuDownload, LuChevronLeft, LuChevronRight,
    LuEye, LuInfo, LuGlobe, LuShield, LuClock, LuUser
} from 'react-icons/lu';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast, Toast } from '@/components/ui/toast-alert';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { format } from 'date-fns';

interface Log {
    id: string;
    createdAt: string;
    action: string;
    entityType?: string;
    entityId?: string;
    userId?: string;
    user?: {
        username: string;
    };
    status: string;
    ipAddress?: string;
    method?: string;
    endpoint?: string;
    userAgent?: string;
    changes?: Record<string, unknown>;
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedLog, setSelectedLog] = useState<Log | null>(null);
    const { toast, showToast, hideToast } = useToast();

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/logs', {
                params: {
                    page,
                    limit: 15,
                    search: search || undefined,
                    status: statusFilter || undefined
                }
            });
            setLogs(data.logs);
            setTotal(data.pagination.total);
        } catch (e) {
            console.error(e);
            showToast('error', 'Failed to fetch logs');
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, search, showToast]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleExport = async () => {
        try {
            const response = await api.get('/logs/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'audit-logs.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            showToast('success', 'Logs exported successfully');
        } catch {
            showToast('error', 'Export failed');
        }
    };

    const getFriendlyActionName = (action: string) => {
        const mapping: Record<string, string> = {
            'POST /v1/auth/login': 'User Login',
            'POST /login': 'User Login',
            'POST /v1/universities': 'Create University',
            'PUT /v1/universities': 'Update University',
            'DELETE /v1/universities': 'Delete University',
            'POST /v1/users': 'Create User',
            'PUT /v1/users': 'Update User',
            'DELETE /v1/users': 'Delete User',
            'PATCH /v1/users': 'Update User Status',
            'GET /v1/logs/export': 'Export Audit Logs',
            'DELETE_UNIVERSITY': 'Delete University',
            'CREATE_UNIVERSITY': 'Create University',
            'UPDATE_UNIVERSITY': 'Update University',
        };

        // Try exact match or check if it starts with the method + space
        if (mapping[action]) return mapping[action];

        // Remove UUIDs and technical prefixes for cleaner display if no mapping
        return action
            .replace(/POST |PUT |DELETE |PATCH |\/v1\//g, '')
            .replace(/\/[a-f0-9-]{36}/g, '') // remove UUIDs
            .replace(/\//g, ' ')
            .trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const navItems = [
        { title: 'Overview', href: '/superadmin', icon: <LuLayoutDashboard className="w-5 h-5" /> },
        { title: 'Universities', href: '/superadmin/universities', icon: <LuBuilding2 className="w-5 h-5" /> },
        { title: 'Users', href: '/superadmin/users', icon: <LuUsers className="w-5 h-5" /> },
        { title: 'Audit Logs', href: '/superadmin/logs', icon: <LuClipboardList className="w-5 h-5" /> },
    ];

    return (
        <ProtectedRoute allowedRoles={['SUPERADMIN']}>
            <DashboardLayout navItems={navItems} title="System Audit Logs">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Audit Trail</h2>
                        <p className="text-slate-500 text-sm">Monitor every administrative action across the platform.</p>
                    </div>
                    <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
                        <LuDownload className="w-4 h-4" /> Export CSV
                    </Button>
                </div>

                <Card className="mb-6 shadow-sm">
                    <CardHeader className="pb-3 border-b bg-slate-50/30">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <LuSearch className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <Input
                                    className="pl-9"
                                    placeholder="Search by action, ID, or IP..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                                />
                            </div>
                            <div className="flex gap-2">
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="">All Status</option>
                                    <option value="SUCCESS">Success Only</option>
                                    <option value="FAILURE">Failure Only</option>
                                </select>
                                <Button onClick={fetchLogs} variant="outline">Apply Filters</Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold uppercase tracking-wider">Timestamp</th>
                                        <th className="px-6 py-4 font-semibold uppercase tracking-wider">Action</th>
                                        <th className="px-6 py-4 font-semibold uppercase tracking-wider">Actor</th>
                                        <th className="px-6 py-4 font-semibold uppercase tracking-wider">Target</th>
                                        <th className="px-6 py-4 font-semibold uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center text-slate-400">
                                                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-2" />
                                                Loading trails...
                                            </td>
                                        </tr>
                                    ) : logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center text-slate-400 italic">No logs found matching criteria.</td>
                                        </tr>
                                    ) : logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                                                {format(new Date(log.createdAt), 'MMM dd, HH:mm:ss')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-700">{getFriendlyActionName(log.action)}</div>
                                                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">{log.entityType || 'SYSTEM'}</div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-600">
                                                {log.user?.username || log.userId?.split('-')[0] || 'System'}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-600 truncate max-w-[150px]">
                                                {log.entityId || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {log.status === 'SUCCESS' ? (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">SUCCESS</span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100/80 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/50">FAILURE</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-full"
                                                    onClick={() => setSelectedLog(log)}
                                                >
                                                    <LuEye className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 border-t bg-slate-50/30 flex justify-between items-center">
                            <span className="text-xs text-slate-500">Showing {logs.length} of {total} entries</span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    <LuChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={logs.length < 15 || page * 15 >= total}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    <LuChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <LuShield className="w-5 h-5 text-primary" />
                                Audit Log Details
                            </DialogTitle>
                            <DialogDescription>
                                Deep dive into the selected system event.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedLog && (
                            <div className="space-y-6 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                            <LuClock className="w-3 h-3" /> Event Time
                                        </div>
                                        <p className="text-slate-700 dark:text-slate-300 font-medium">
                                            {format(new Date(selectedLog.createdAt), 'PPPP')}
                                        </p>
                                        <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                                            {format(new Date(selectedLog.createdAt), 'HH:mm:ss.SSS')}
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                            <LuUser className="w-3 h-3" /> Performed By (Who)
                                        </div>
                                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                                            {selectedLog.user?.username || 'System/Automated'}
                                        </p>
                                        <p className="text-xs text-slate-500 font-mono mt-1 truncate">
                                            {selectedLog.userId || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                                        <LuGlobe className="w-3 h-3" /> Context & Location (Where)
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3">
                                        <div>
                                            <span className="text-xs text-slate-500 block">IP Address</span>
                                            <span className="font-mono text-slate-700 dark:text-slate-300">{selectedLog.ipAddress || 'Unknown'}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-500 block">Method & Endpoint</span>
                                            <span className="font-mono text-xs bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                                                {selectedLog.method} {selectedLog.endpoint}
                                            </span>
                                        </div>
                                        <div className="md:col-span-2">
                                            <span className="text-xs text-slate-500 block">User Agent</span>
                                            <span className="text-[10px] text-slate-500 leading-relaxed block break-all mt-1">
                                                {selectedLog.userAgent || 'Not captured'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                                        <LuInfo className="w-3 h-3" /> Change-set Details (What)
                                    </div>
                                    <div className="bg-slate-950 rounded-lg p-4 overflow-x-auto max-h-[300px]">
                                        <pre className="text-xs text-emerald-400 font-mono">
                                            {JSON.stringify(selectedLog.changes || {}, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <Toast toast={toast} onClose={hideToast} />
            </DashboardLayout>
        </ProtectedRoute>
    );
}
