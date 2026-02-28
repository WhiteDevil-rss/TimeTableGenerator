'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { LuPlay, LuUsers, LuCheckSquare, LuSquare, LuLoader2 } from 'react-icons/lu';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { DEPT_ADMIN_NAV } from '@/lib/constants/nav-config';

interface BatchItem {
    id: string;
    name: string;
    program: string | null;
    semester: number | null;
    strength: number;
}

export default function GenerateTimetablePage() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [semesterFilter, setSemesterFilter] = useState('all');

    // Batch selection
    const [batches, setBatches] = useState<BatchItem[]>([]);
    const [batchesLoading, setBatchesLoading] = useState(true);
    const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());
    const [batchSearch, setBatchSearch] = useState('');

    // AI Engine health
    interface AiHealth {
        status: string;
        reachable: boolean;
        solver?: string;
        solverTimeoutMs?: number;
        hardConstraints?: number;
        softConstraints?: number;
        version?: string;
    }
    const [aiHealth, setAiHealth] = useState<AiHealth | null>(null);

    const [config, setConfig] = useState({
        startTime: "09:00",
        endTime: "16:00",
        lectureDuration: 60,
        breakDuration: 60,
        numberOfBreaks: 1,
        daysPerWeek: 6
    });

    // Fetch batches + AI health on mount
    useEffect(() => {
        async function loadBatches() {
            try {
                const res = await api.get('/batches');
                const data: BatchItem[] = res.data;
                setBatches(data);
                setSelectedBatchIds(new Set(data.map(b => b.id)));
            } catch { /* ignore */ } finally { setBatchesLoading(false); }
        }
        async function loadAiHealth() {
            try {
                const res = await api.get('/ai-health');
                setAiHealth(res.data);
            } catch { setAiHealth({ status: 'offline', reachable: false }); }
        }
        loadBatches();
        loadAiHealth();
    }, []);

    const fetchLatestTimetable = useCallback(async () => {
        if (!user?.entityId) return;
        try {
            await api.get(`/departments/${user.entityId}/timetables/latest`);
        } catch { console.log("No active timetable found."); }
    }, [user?.entityId]);

    useEffect(() => { fetchLatestTimetable(); }, [user, fetchLatestTimetable]);

    // Filter batches by semester
    const filteredBatches = useMemo(() => {
        let result = batches;
        if (semesterFilter === 'odd') result = result.filter(b => b.semester && [1, 3, 5, 7, 9].includes(b.semester));
        else if (semesterFilter === 'even') result = result.filter(b => b.semester && [2, 4, 6, 8, 10].includes(b.semester));
        if (batchSearch) result = result.filter(b => b.name.toLowerCase().includes(batchSearch.toLowerCase()));
        return result;
    }, [batches, semesterFilter, batchSearch]);

    // When semester filter changes, auto-select all matching batches
    useEffect(() => {
        const matching = batches.filter(b => {
            if (semesterFilter === 'odd') return b.semester && [1, 3, 5, 7, 9].includes(b.semester);
            if (semesterFilter === 'even') return b.semester && [2, 4, 6, 8, 10].includes(b.semester);
            return true;
        });
        setSelectedBatchIds(new Set(matching.map(b => b.id)));
    }, [semesterFilter, batches]);

    const allFilteredSelected = filteredBatches.length > 0 && filteredBatches.every(b => selectedBatchIds.has(b.id));

    const toggleSelectAll = () => {
        const next = new Set(selectedBatchIds);
        if (allFilteredSelected) {
            filteredBatches.forEach(b => next.delete(b.id));
        } else {
            filteredBatches.forEach(b => next.add(b.id));
        }
        setSelectedBatchIds(next);
    };

    const toggleBatch = (id: string) => {
        const next = new Set(selectedBatchIds);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelectedBatchIds(next);
    };

    const handleGenerate = async () => {
        if (!user?.entityId) return;
        if (selectedBatchIds.size === 0) {
            setError('Please select at least one batch to generate a timetable.');
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.post(`/departments/${user.entityId}/timetables/generate`, {
                departmentId: user.entityId,
                config,
                semesterFilter,
                selectedBatchIds: Array.from(selectedBatchIds)
            });
            setSuccess(`Success! Timetable generated in ${response.data.timetable.generationMs}ms.`);
            await fetchLatestTimetable();
        } catch (e) {
            const errorMsg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to generate timetable.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute allowedRoles={['DEPT_ADMIN']}>
            <DashboardLayout navItems={DEPT_ADMIN_NAV} title="Create New Timetable">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 print:hidden">
                    {/* ── Left: Config ───────────────────────── */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl">Generate Timetable</CardTitle>
                                <CardDescription>Configure time parameters and select batches to schedule.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {error && <div className="p-3 bg-red-50 text-red-600 rounded text-sm font-medium">{error}</div>}
                                {success && (
                                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="text-emerald-800 font-medium">{success}</div>
                                        <Link href="/department/timetables/view">
                                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">View Timetable</Button>
                                        </Link>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Start Time</label>
                                        <Input type="time" value={config.startTime} onChange={(e) => setConfig({ ...config, startTime: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">End Time</label>
                                        <Input type="time" value={config.endTime} onChange={(e) => setConfig({ ...config, endTime: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Lecture Duration (mins)</label>
                                        <Input type="number" min="15" max="180" step="15" value={config.lectureDuration} onChange={(e) => setConfig({ ...config, lectureDuration: parseInt(e.target.value) || 60 })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Break Duration (mins)</label>
                                        <Input type="number" min="0" max="120" step="5" value={config.breakDuration} onChange={(e) => setConfig({ ...config, breakDuration: parseInt(e.target.value) || 0 })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Number of Breaks</label>
                                        <Input type="number" min="0" max="5" value={config.numberOfBreaks} onChange={(e) => setConfig({ ...config, numberOfBreaks: parseInt(e.target.value) || 0 })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Working Days</label>
                                        <Input type="number" min="1" max="7" value={config.daysPerWeek} onChange={(e) => setConfig({ ...config, daysPerWeek: parseInt(e.target.value) || 5 })} />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50/50 border-t p-6">
                                <Button onClick={handleGenerate} disabled={loading || selectedBatchIds.size === 0} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base">
                                    {loading ? <LuLoader2 className="w-5 h-5 mr-2 animate-spin" /> : <LuPlay className="w-5 h-5 mr-2" />}
                                    {loading ? 'Solving Constraints...' : `Generate for ${selectedBatchIds.size} Batch${selectedBatchIds.size !== 1 ? 'es' : ''}`}
                                </Button>
                            </CardFooter>
                        </Card>

                        {/* AI Engine Status — Dynamic */}
                        <Card className={cn("shadow-sm border", aiHealth?.reachable ? "bg-indigo-50 border-indigo-100" : "bg-red-50 border-red-100")}>
                            <CardHeader className="pb-3">
                                <CardTitle className={cn("text-lg flex items-center gap-2", aiHealth?.reachable ? "text-indigo-900" : "text-red-800")}>
                                    <span className={cn("w-2 h-2 rounded-full", aiHealth?.reachable ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                                    AI Engine {aiHealth ? (aiHealth.reachable ? 'Online' : 'Offline') : '...'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Solver</span>
                                    <span className="font-semibold text-slate-800 bg-white/60 px-2 rounded text-xs">{aiHealth?.solver || '—'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Timeout</span>
                                    <span className="font-semibold text-slate-800 bg-white/60 px-2 rounded text-xs">{aiHealth?.solverTimeoutMs ? `${(aiHealth.solverTimeoutMs / 1000).toFixed(0)}s` : '—'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Concurrency Lock</span>
                                    <span className="font-semibold text-emerald-700 bg-emerald-100 px-2 rounded text-xs">Redis Distributed</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Hard Constraints</span>
                                    <span className="font-semibold text-slate-800 bg-white/60 px-2 rounded text-xs">{aiHealth?.hardConstraints ?? '—'} Active</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Soft Constraints</span>
                                    <span className="font-semibold text-slate-800 bg-white/60 px-2 rounded text-xs">{aiHealth?.softConstraints ?? '—'} Active</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Version</span>
                                    <span className="font-semibold text-slate-800 bg-white/60 px-2 rounded text-xs">v{aiHealth?.version || '—'}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Right: Batch Selection ────────────── */}
                    <div className="lg:col-span-1">
                        <Card className="shadow-sm sticky top-4">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <LuUsers className="w-5 h-5 text-indigo-500" />
                                    Batch Selection
                                </CardTitle>
                                <CardDescription>Choose which batches to include in timetable generation.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Semester Filter */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Semester</label>
                                    <select
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        value={semesterFilter}
                                        onChange={(e) => setSemesterFilter(e.target.value)}
                                    >
                                        <option value="all">All Semesters</option>
                                        <option value="odd">Odd (1, 3, 5...)</option>
                                        <option value="even">Even (2, 4, 6...)</option>
                                    </select>
                                </div>

                                {/* Search */}
                                <Input placeholder="Search batches..." value={batchSearch} onChange={(e) => setBatchSearch(e.target.value)} className="h-8 text-sm" />

                                {/* Select All */}
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                                        {selectedBatchIds.size} of {filteredBatches.length} selected
                                    </span>
                                    <button onClick={toggleSelectAll} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wide">
                                        {allFilteredSelected ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>

                                {/* Batch List */}
                                <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
                                    {batchesLoading ? (
                                        <div className="flex items-center justify-center py-8 text-slate-400">
                                            <LuLoader2 className="w-5 h-5 animate-spin" />
                                        </div>
                                    ) : filteredBatches.length === 0 ? (
                                        <p className="text-xs text-slate-400 text-center py-4">No batches match this filter.</p>
                                    ) : (
                                        filteredBatches.map(b => (
                                            <div
                                                key={b.id}
                                                onClick={() => toggleBatch(b.id)}
                                                className={cn(
                                                    "flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all",
                                                    selectedBatchIds.has(b.id)
                                                        ? "bg-indigo-50/80 border-indigo-200 shadow-sm"
                                                        : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                                                )}
                                            >
                                                {selectedBatchIds.has(b.id) ? (
                                                    <LuCheckSquare className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                                ) : (
                                                    <LuSquare className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                )}
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-semibold truncate">{b.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                                                        Sem {b.semester ?? '—'} • {b.program || 'General'} • {b.strength} students
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
