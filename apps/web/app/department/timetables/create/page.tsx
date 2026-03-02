'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { LuPlay, LuUsers, LuSquareCheck, LuSquare, LuLoaderCircle, LuLayers } from 'react-icons/lu';
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
    const [continuousMode, setContinuousMode] = useState<'off' | 'balanced' | 'strict'>('balanced');
    const [generationType, setGenerationType] = useState<'NORMAL' | 'LAB_ONLY' | 'ELECTIVE_ONLY'>('NORMAL');
    const [lockedSlots, setLockedSlots] = useState<any[]>([]);
    const [activeTimetable, setActiveTimetable] = useState<any>(null);

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
            const res = await api.get(`/departments/${user.entityId}/timetables/latest`);
            setActiveTimetable(res.data.timetable);
        } catch {
            console.log("No active timetable found.");
            setActiveTimetable(null);
        }
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
                selectedBatchIds: Array.from(selectedBatchIds),
                continuousMode,
                generationType,
                lockedSlots: lockedSlots.length > 0 ? lockedSlots : undefined
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
                        <Card className="glass-card shadow-sm border-slate-200 dark:border-white/10">
                            <CardHeader>
                                <CardTitle className="text-xl dark:text-white">Generate Timetable</CardTitle>
                                <CardDescription className="dark:text-slate-400">Configure time parameters and select batches to schedule.</CardDescription>
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
                                        <label className="text-sm font-medium dark:text-slate-300">Start Time</label>
                                        <Input type="time" className="dark:bg-[#0a0a0c] dark:border-white/10 dark:text-white" value={config.startTime} onChange={(e) => setConfig({ ...config, startTime: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium dark:text-slate-300">End Time</label>
                                        <Input type="time" className="dark:bg-[#0a0a0c] dark:border-white/10 dark:text-white" value={config.endTime} onChange={(e) => setConfig({ ...config, endTime: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium dark:text-slate-300">Lecture Duration (mins)</label>
                                        <Input type="number" className="dark:bg-[#0a0a0c] dark:border-white/10 dark:text-white" min="15" max="180" step="15" value={config.lectureDuration} onChange={(e) => setConfig({ ...config, lectureDuration: parseInt(e.target.value) || 60 })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium dark:text-slate-300">Break Duration (mins)</label>
                                        <Input type="number" className="dark:bg-[#0a0a0c] dark:border-white/10 dark:text-white" min="0" max="120" step="5" value={config.breakDuration} onChange={(e) => setConfig({ ...config, breakDuration: parseInt(e.target.value) || 0 })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium dark:text-slate-300">Number of Breaks</label>
                                        <Input type="number" className="dark:bg-[#0a0a0c] dark:border-white/10 dark:text-white" min="0" max="5" value={config.numberOfBreaks} onChange={(e) => setConfig({ ...config, numberOfBreaks: parseInt(e.target.value) || 0 })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium dark:text-slate-300">Working Days</label>
                                        <Input type="number" className="dark:bg-[#0a0a0c] dark:border-white/10 dark:text-white" min="1" max="7" value={config.daysPerWeek} onChange={(e) => setConfig({ ...config, daysPerWeek: parseInt(e.target.value) || 5 })} />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50/50 dark:bg-white/5 border-t dark:border-white/10 p-6">
                                <Button onClick={handleGenerate} disabled={loading || selectedBatchIds.size === 0} className="w-full bg-neon-cyan hover:bg-cyan-600 dark:text-[#0a0a0c] text-white shadow-[0_0_15px_rgba(57,193,239,0.4)] h-12 text-base font-bold transition-all">
                                    {loading ? <LuLoaderCircle className="w-5 h-5 mr-2 animate-spin" /> : <LuPlay className="w-5 h-5 mr-2" />}
                                    {loading ? 'Solving Constraints...' : `Generate for ${selectedBatchIds.size} Batch${selectedBatchIds.size !== 1 ? 'es' : ''}`}
                                </Button>
                            </CardFooter>
                        </Card>

                        {/* ── Scheduling Mode (Optimized) ────────── */}
                        <Card className="glass-card shadow-sm border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-900/10">
                            <CardHeader className="pb-3 text-center sm:text-left">
                                <CardTitle className="text-lg text-indigo-900 dark:text-indigo-300 flex items-center justify-center sm:justify-start gap-2">
                                    <LuLayers className="w-5 h-5" /> Scheduling Mode
                                </CardTitle>
                                <CardDescription className="dark:text-slate-400">Optimize how strictly the AI handles time gaps between classes.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {[
                                        { id: 'off', label: 'Standard', desc: 'Focus on basic constraints only.', color: 'slate' },
                                        { id: 'balanced', label: 'Balanced', desc: 'Minimize idle gaps for students.', color: 'indigo' },
                                        { id: 'strict', label: 'Continuous', desc: 'Minimize gaps strictly (Back-to-back).', color: 'cyan' },
                                    ].map(mode => (
                                        <button
                                            key={mode.id}
                                            onClick={() => setContinuousMode(mode.id as any)}
                                            className={cn(
                                                "flex flex-col p-3 rounded-xl border text-left transition-all",
                                                continuousMode === mode.id
                                                    ? `bg-white dark:bg-slate-800 border-${mode.color}-200 dark:border-${mode.color}-500/40 shadow-sm ring-2 ring-${mode.color}-500/20`
                                                    : "bg-transparent border-transparent opacity-60 hover:opacity-100"
                                            )}
                                        >
                                            <span className={cn("text-xs font-bold uppercase tracking-tight", continuousMode === mode.id && (mode.id === 'off' ? 'dark:text-slate-200' : `text-${mode.color}-600 dark:text-${mode.color}-400`))}>{mode.label}</span>
                                            <span className="text-[10px] text-slate-500 mt-1 leading-tight">{mode.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* ── Generation Strategy ─────────────────── */}
                        <Card className="glass-card shadow-sm border-amber-200 dark:border-amber-500/20 bg-amber-50/20 dark:bg-amber-900/10">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg text-amber-900 dark:text-amber-300 flex items-center gap-2">
                                    <LuLayers className="w-5 h-5" /> Generation Strategy
                                </CardTitle>
                                <CardDescription className="dark:text-slate-400">Choose the scope of this generation run.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {[
                                        { id: 'NORMAL', label: 'Full Rebuild', desc: 'Regenerate everything.', color: 'indigo' },
                                        { id: 'LAB_ONLY', label: 'Lab Only', desc: 'Only schedule lab sessions.', color: 'emerald' },
                                        { id: 'ELECTIVE_ONLY', label: 'Electives Only', desc: 'Only schedule elective baskets.', color: 'amber' },
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setGenerationType(type.id as any)}
                                            className={cn(
                                                "flex flex-col p-3 rounded-xl border text-left transition-all",
                                                generationType === type.id
                                                    ? `bg-white dark:bg-slate-800 border-${type.color}-200 dark:border-${type.color}-500/40 shadow-sm ring-2 ring-${type.color}-500/20`
                                                    : "bg-transparent border-transparent opacity-60 hover:opacity-100"
                                            )}
                                        >
                                            <span className={cn("text-xs font-bold uppercase tracking-tight", generationType === type.id && `text-${type.color}-600 dark:text-${type.color}-400`)}>{type.label}</span>
                                            <span className="text-[10px] text-slate-500 mt-1 leading-tight">{type.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* ── Partial Regeneration (Locked Slots) ───── */}
                        {activeTimetable && (
                            <Card className="glass-card shadow-sm border-slate-200 dark:border-white/10">
                                <CardHeader className="pb-3 border-b dark:border-white/5">
                                    <CardTitle className="text-lg dark:text-white flex items-center gap-2">
                                        <LuSquareCheck className="w-5 h-5 text-emerald-500" /> Partial Regeneration
                                    </CardTitle>
                                    <CardDescription className="dark:text-slate-400">
                                        Select slots from the active timetable to <b>LOCK</b>. Locked slots will not be moved.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4 overflow-x-auto">
                                    <div className="min-w-[500px]">
                                        <table className="w-full text-xs text-left border-collapse border dark:border-white/10 rounded-lg">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-slate-900/50">
                                                    <th className="p-2 border dark:border-white/10 font-bold dark:text-slate-300">Day</th>
                                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <th key={s} className="p-2 border dark:border-white/10 text-center font-bold dark:text-slate-300">Slot {s}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                                                    <tr key={day}>
                                                        <td className="p-2 border dark:border-white/10 font-semibold bg-slate-50/50 dark:bg-slate-900/30 dark:text-slate-400 w-24">{day}</td>
                                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(slot => {
                                                            const isLocked = lockedSlots.some(ls => ls.day === day && ls.slot === slot);
                                                            const hasExisting = activeTimetable.entries?.some((e: any) => e.day === day && e.slot === slot);

                                                            return (
                                                                <td
                                                                    key={slot}
                                                                    onClick={() => {
                                                                        if (isLocked) {
                                                                            setLockedSlots(lockedSlots.filter(ls => !(ls.day === day && ls.slot === slot)));
                                                                        } else {
                                                                            setLockedSlots([...lockedSlots, { day, slot }]);
                                                                        }
                                                                    }}
                                                                    className={cn(
                                                                        "p-2 border dark:border-white/10 text-center cursor-pointer transition-all h-10",
                                                                        isLocked ? "bg-emerald-100 dark:bg-emerald-500/20" : "hover:bg-slate-50 dark:hover:bg-white/5"
                                                                    )}
                                                                >
                                                                    {isLocked ? (
                                                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">LOCKED</span>
                                                                    ) : hasExisting ? (
                                                                        <span className="text-slate-400 dark:text-slate-600">Active</span>
                                                                    ) : (
                                                                        <span className="text-slate-200 dark:text-slate-800">—</span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <div className="mt-3 flex items-center justify-between">
                                            <p className="text-[10px] text-slate-500 italic">* Only slots with active sessions can be meaningfully locked.</p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setLockedSlots([])}
                                                className="text-[10px] h-6 px-2 text-red-500 hover:text-red-600 dark:hover:bg-red-500/10"
                                            >
                                                Clear All Locks
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}


                        {/* AI Engine Status — Dynamic */}
                        <Card className={cn("shadow-sm border glass-card", aiHealth?.reachable ? "bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-500/20" : "bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-500/20")}>
                            <CardHeader className="pb-3">
                                <CardTitle className={cn("text-lg flex items-center gap-2", aiHealth?.reachable ? "text-indigo-900 dark:text-indigo-300" : "text-red-800 dark:text-red-300")}>
                                    <span className={cn("w-2 h-2 rounded-full", aiHealth?.reachable ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]")} />
                                    AI Engine {aiHealth ? (aiHealth.reachable ? 'Online' : 'Offline') : '...'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Solver</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 bg-white/60 dark:bg-white/10 px-2 rounded text-xs">{aiHealth?.solver || '—'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Timeout</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 bg-white/60 dark:bg-white/10 px-2 rounded text-xs">{aiHealth?.solverTimeoutMs ? `${(aiHealth.solverTimeoutMs / 1000).toFixed(0)}s` : '—'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Concurrency Lock</span>
                                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 rounded text-xs">Redis Distributed</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Hard Constraints</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 bg-white/60 dark:bg-white/10 px-2 rounded text-xs">{aiHealth?.hardConstraints ?? '—'} Active</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Soft Constraints</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 bg-white/60 dark:bg-white/10 px-2 rounded text-xs">{aiHealth?.softConstraints ?? '—'} Active</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Version</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 bg-white/60 dark:bg-white/10 px-2 rounded text-xs">v{aiHealth?.version || '—'}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Right: Batch Selection ────────────── */}
                    <div className="lg:col-span-1">
                        <Card className="glass-card shadow-sm border-slate-200 dark:border-white/10 sticky top-4">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
                                    <LuUsers className="w-5 h-5 text-indigo-500 dark:text-neon-cyan" />
                                    Batch Selection
                                </CardTitle>
                                <CardDescription className="dark:text-slate-400">Choose which batches to include in timetable generation.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Semester Filter */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Semester</label>
                                    <select
                                        className="flex h-9 w-full rounded-md border border-input bg-background dark:bg-[#0a0a0c] dark:border-white/10 dark:text-white px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        value={semesterFilter}
                                        onChange={(e) => setSemesterFilter(e.target.value)}
                                    >
                                        <option value="all">All Semesters</option>
                                        <option value="odd">Odd (1, 3, 5...)</option>
                                        <option value="even">Even (2, 4, 6...)</option>
                                    </select>
                                </div>

                                {/* Search */}
                                <Input placeholder="Search batches..." value={batchSearch} onChange={(e) => setBatchSearch(e.target.value)} className="h-8 text-sm dark:bg-[#0a0a0c] dark:border-white/10 dark:text-white" />

                                {/* Select All */}
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                                        {selectedBatchIds.size} of {filteredBatches.length} selected
                                    </span>
                                    <button onClick={toggleSelectAll} className="text-xs font-bold text-indigo-600 dark:text-neon-cyan hover:text-indigo-800 dark:hover:text-cyan-400 uppercase tracking-wide transition-colors">
                                        {allFilteredSelected ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>

                                {/* Batch List */}
                                <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
                                    {batchesLoading ? (
                                        <div className="flex items-center justify-center py-8 text-slate-400 dark:text-slate-600">
                                            <LuLoaderCircle className="w-5 h-5 animate-spin" />
                                        </div>
                                    ) : filteredBatches.length === 0 ? (
                                        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">No batches match this filter.</p>
                                    ) : (
                                        filteredBatches.map(b => (
                                            <div
                                                key={b.id}
                                                onClick={() => toggleBatch(b.id)}
                                                className={cn(
                                                    "flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all",
                                                    selectedBatchIds.has(b.id)
                                                        ? "bg-indigo-50/80 border-indigo-200 dark:bg-neon-cyan/20 dark:border-neon-cyan/50 shadow-[0_0_10px_rgba(57,193,239,0.1)]"
                                                        : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 dark:bg-white/5 dark:border-white/10 dark:hover:border-white/30 dark:hover:bg-white/10"
                                                )}
                                            >
                                                {selectedBatchIds.has(b.id) ? (
                                                    <LuSquareCheck className="w-4 h-4 text-indigo-500 dark:text-neon-cyan flex-shrink-0" />
                                                ) : (
                                                    <LuSquare className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                                                )}
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-semibold truncate dark:text-slate-200">{b.name}</span>
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-tight">
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
        </ProtectedRoute >
    );
}
