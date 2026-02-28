'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LuTriangleAlert, LuUsers, LuUserX, LuLoader2, LuNetwork, LuCalendar, LuMonitor, LuZap, LuSearch, LuXCircle, LuShieldCheck } from 'react-icons/lu';
import { api } from '@/lib/api';
import { TimetableGrid } from '@/components/timetable/timetable-grid';
import { WorkloadSummary } from '@/components/timetable/workload-summary';
import { TimetableExport } from '@/components/timetable/timetable-export';
import { DEPT_ADMIN_NAV } from '@/lib/constants/nav-config';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Faculty {
    id: string;
    name: string;
    designation?: string;
}

interface Resource {
    id: string;
    name: string;
    type: string;
    building?: string;
}

interface Batch {
    id: string;
    name: string;
    semester: number;
    program?: string;
}

interface Timetable {
    slots: Record<string, unknown>[];
    configJson: Record<string, unknown>;
    generationMs?: number;
}

export default function SpecialTimetablePage() {
    const { user } = useAuthStore();
    const [faculty, setFaculty] = useState<Faculty[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
    const [excludedRoomIds, setExcludedRoomIds] = useState<Set<string>>(new Set());
    const [excludedDayIds, setExcludedDayIds] = useState<Set<number>>(new Set());
    const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const [semesterFilter, setSemesterFilter] = useState('odd'); // Default to odd
    const [activeTab, setActiveTab] = useState<'faculty' | 'resources' | 'batches' | 'days'>('faculty');
    const [facultySearch, setFacultySearch] = useState('');
    const [resourceSearch, setResourceSearch] = useState('');
    const [batchSearch, setBatchSearch] = useState('');

    // Result views
    const [specialTimetable, setSpecialTimetable] = useState<Timetable | null>(null);
    const [baselineTimetable, setBaselineTimetable] = useState<Timetable | null>(null);

    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const [facRes, resRes, batRes] = await Promise.all([
                api.get(`/faculty`), // DEPT_ADMIN auto-scoped by backend to their department
                api.get(`/resources`), // university-wide resources
                api.get(`/batches`),
            ]);
            setFaculty(facRes.data);
            setResources(resRes.data);
            setBatches(batRes.data);
        } catch {
            setError('Failed to load faculty, resources and batches. Please refresh.');
        }

        // Fetch latest timetable separately so a 404 is non-fatal
        try {
            const ttRes = await api.get(`/departments/${user!.entityId}/timetables/latest`);
            setBaselineTimetable(ttRes.data);
        } catch (err) {
            if ((err as { response?: { status?: number } }).response?.status !== 404) {
                console.warn('Could not load baseline timetable:', (err as { message?: string }).message);
            }
            // 404 is expected if no timetable has been generated yet
        } finally {
            setLoading(false);
        }
    }, [user?.entityId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (user?.entityId) {
            fetchInitialData();
        }
    }, [user, fetchInitialData]);

    const toggleFacultyExclusion = (id: string) => {
        const next = new Set(excludedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExcludedIds(next);
    };

    const toggleRoomExclusion = (id: string) => {
        const next = new Set(excludedRoomIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExcludedRoomIds(next);
    };

    const toggleBatchSelection = (id: string) => {
        const next = new Set(selectedBatchIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedBatchIds(next);
    };

    const toggleDayExclusion = (id: number) => {
        const next = new Set(excludedDayIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExcludedDayIds(next);
    };

    const handleGenerateSpecial = async () => {
        if (excludedIds.size === 0 && excludedRoomIds.size === 0 && excludedDayIds.size === 0) {
            setError("Please select at least one faculty member, resource, or day to exclude.");
            return;
        }

        setGenerating(true);
        setError('');
        setSpecialTimetable(null);

        try {
            const config = baselineTimetable?.configJson || {
                startTime: "09:00", endTime: "16:00", lectureDuration: 60, breakDuration: 30, numberOfBreaks: 1, daysPerWeek: 5
            };

            const payload = {
                departmentId: user!.entityId,
                config,
                excludedFacultyIds: Array.from(excludedIds),
                excludedRoomIds: Array.from(excludedRoomIds),
                excludedDayIds: Array.from(excludedDayIds),
                selectedBatchIds: Array.from(selectedBatchIds),
                semesterFilter
            };

            const response = await api.post(`/departments/${user!.entityId}/timetables/generate`, payload);
            setSpecialTimetable(response.data.timetable);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err) {
            if ((err as { response?: { status?: number } }).response?.status === 422) {
                setError('AI Engine: Impossible to generate a valid timetable with these exclusions (Constraint Failure).');
            } else {
                setError('Failed to generate special timetable.');
            }
        } finally {
            setGenerating(false);
        }
    };

    if (loading) return (
        <DashboardLayout navItems={DEPT_ADMIN_NAV} title="Special Schedule">
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                <LuLoader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="animate-pulse">Loading university configuration...</p>
            </div>
        </DashboardLayout>
    );

    const filteredFaculty = faculty.filter(f =>
        f.name.toLowerCase().includes(facultySearch.toLowerCase())
    );

    const filteredResources = resources.filter(r =>
        r.name.toLowerCase().includes(resourceSearch.toLowerCase()) ||
        (r.building || '').toLowerCase().includes(resourceSearch.toLowerCase())
    );

    return (
        <DashboardLayout navItems={DEPT_ADMIN_NAV} title="Special Timetable">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Exclusions Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
                        <CardHeader className="bg-slate-50/50 border-b pb-4 px-4 pt-4">
                            <CardTitle className="flex items-center gap-2 text-slate-800 text-lg">
                                <LuTriangleAlert className="w-5 h-5 text-amber-500" />
                                Exclusions
                            </CardTitle>
                            <CardDescription className="text-xs leading-relaxed">
                                Select staff or rooms unavailable for the contingency matrix.
                            </CardDescription>
                        </CardHeader>

                        {/* Custom Tabs */}
                        <div className="flex border-b overflow-x-auto scrollbar-none bg-slate-50/50">
                            <button
                                onClick={() => setActiveTab('faculty')}
                                className={cn(
                                    "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 px-2 whitespace-nowrap",
                                    activeTab === 'faculty' ? "border-indigo-500 text-indigo-600 bg-white" : "border-transparent text-slate-400 hover:text-slate-600"
                                )}
                            >
                                Faculty <Badge variant="secondary" className="ml-0.5 px-1 py-0 min-w-[1rem] h-3.5 bg-slate-100/80">{excludedIds.size}</Badge>
                            </button>
                            <button
                                onClick={() => setActiveTab('resources')}
                                className={cn(
                                    "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 px-2 whitespace-nowrap",
                                    activeTab === 'resources' ? "border-indigo-500 text-indigo-600 bg-white" : "border-transparent text-slate-400 hover:text-slate-600"
                                )}
                            >
                                Rooms <Badge variant="secondary" className="ml-0.5 px-1 py-0 min-w-[1rem] h-3.5 bg-slate-100/80">{excludedRoomIds.size}</Badge>
                            </button>
                            <button
                                onClick={() => setActiveTab('batches')}
                                className={cn(
                                    "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 px-2 whitespace-nowrap",
                                    activeTab === 'batches' ? "border-indigo-500 text-indigo-600 bg-white" : "border-transparent text-slate-400 hover:text-slate-600"
                                )}
                            >
                                Batches <Badge variant="secondary" className="ml-0.5 px-1 py-0 min-w-[1rem] h-3.5 bg-slate-100/80">{selectedBatchIds.size}</Badge>
                            </button>
                            <button
                                onClick={() => setActiveTab('days')}
                                className={cn(
                                    "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 px-2 whitespace-nowrap",
                                    activeTab === 'days' ? "border-indigo-500 text-indigo-600 bg-white" : "border-transparent text-slate-400 hover:text-slate-600"
                                )}
                            >
                                Days <Badge variant="secondary" className="ml-0.5 px-1 py-0 min-w-[1rem] h-3.5 bg-slate-100/80">{excludedDayIds.size}</Badge>
                            </button>
                        </div>

                        {activeTab !== 'days' && (
                            <div className="p-3 border-b bg-white">
                                <div className="relative">
                                    <LuSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder={activeTab === 'faculty' ? "Filter faculty..." : activeTab === 'resources' ? "Filter rooms..." : "Filter batches..."}
                                        className="pl-9 h-9 text-xs"
                                        value={activeTab === 'faculty' ? facultySearch : activeTab === 'resources' ? resourceSearch : batchSearch}
                                        onChange={(e) => {
                                            if (activeTab === 'faculty') setFacultySearch(e.target.value);
                                            else if (activeTab === 'resources') setResourceSearch(e.target.value);
                                            else setBatchSearch(e.target.value);
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        <CardContent className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                            {activeTab === 'faculty' ? (
                                <div className="space-y-1">
                                    {filteredFaculty.map(f => (
                                        <div
                                            key={f.id}
                                            onClick={() => toggleFacultyExclusion(f.id)}
                                            className={cn(
                                                "group flex items-center justify-between p-2 rounded border cursor-pointer transition-all",
                                                excludedIds.has(f.id)
                                                    ? "bg-red-50/80 border-red-200 text-red-900 shadow-sm"
                                                    : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black uppercase",
                                                    excludedIds.has(f.id) ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
                                                )}>
                                                    {f.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[12px] font-bold leading-tight">{f.name}</span>
                                                    <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">{f.designation || 'Staff'}</span>
                                                </div>
                                            </div>
                                            {excludedIds.has(f.id) && <LuXCircle className="w-3.5 h-3.5 text-red-400" />}
                                        </div>
                                    ))}
                                    {filteredFaculty.length === 0 && <div className="p-8 text-center text-slate-400 text-[10px] italic font-medium uppercase tracking-widest">No matching faculty.</div>}
                                </div>
                            ) : activeTab === 'resources' ? (
                                <div className="space-y-1">
                                    {filteredResources.map(r => (
                                        <div
                                            key={r.id}
                                            onClick={() => toggleRoomExclusion(r.id)}
                                            className={cn(
                                                "group flex items-center justify-between p-2 rounded border cursor-pointer transition-all",
                                                excludedRoomIds.has(r.id)
                                                    ? "bg-red-50/80 border-red-200 text-red-900 shadow-sm"
                                                    : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black uppercase",
                                                    excludedRoomIds.has(r.id) ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
                                                )}>
                                                    <LuMonitor className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[12px] font-bold leading-tight">{r.name}</span>
                                                    <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">{r.type} • {r.building || 'Main'}</span>
                                                </div>
                                            </div>
                                            {excludedRoomIds.has(r.id) && <LuXCircle className="w-3.5 h-3.5 text-red-400" />}
                                        </div>
                                    ))}
                                    {filteredResources.length === 0 && <div className="p-8 text-center text-slate-400 text-[10px] italic font-medium uppercase tracking-widest">No matching rooms.</div>}
                                </div>
                            ) : activeTab === 'batches' ? (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-1 mb-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter: {semesterFilter} semesters</span>
                                        <button
                                            onClick={() => {
                                                const currentMatching = batches.filter(b =>
                                                    (semesterFilter === 'all' ||
                                                        (semesterFilter === 'odd' && [1, 3, 5, 7, 9].includes(b.semester)) ||
                                                        (semesterFilter === 'even' && [2, 4, 6, 8, 10].includes(b.semester))) &&
                                                    b.name.toLowerCase().includes(batchSearch.toLowerCase())
                                                );
                                                const allSelected = currentMatching.every(b => selectedBatchIds.has(b.id));
                                                const next = new Set(selectedBatchIds);
                                                if (allSelected) {
                                                    currentMatching.forEach(b => next.delete(b.id));
                                                } else {
                                                    currentMatching.forEach(b => next.add(b.id));
                                                }
                                                setSelectedBatchIds(next);
                                            }}
                                            className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest"
                                        >
                                            {batches.filter(b =>
                                                (semesterFilter === 'all' ||
                                                    (semesterFilter === 'odd' && [1, 3, 5, 7, 9].includes(b.semester)) ||
                                                    (semesterFilter === 'even' && [2, 4, 6, 8, 10].includes(b.semester))) &&
                                                b.name.toLowerCase().includes(batchSearch.toLowerCase())
                                            ).every(b => selectedBatchIds.has(b.id)) ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    <div className="space-y-1">
                                        {batches
                                            .filter(b =>
                                            (semesterFilter === 'all' ||
                                                (semesterFilter === 'odd' && [1, 3, 5, 7, 9].includes(b.semester)) ||
                                                (semesterFilter === 'even' && [2, 4, 6, 8, 10].includes(b.semester)))
                                            )
                                            .filter(b => b.name.toLowerCase().includes(batchSearch.toLowerCase()))
                                            .map(b => (
                                                <div
                                                    key={b.id}
                                                    onClick={() => toggleBatchSelection(b.id)}
                                                    className={cn(
                                                        "group flex items-center justify-between p-2 rounded border cursor-pointer transition-all",
                                                        selectedBatchIds.has(b.id)
                                                            ? "bg-indigo-50/80 border-indigo-200 text-indigo-900 shadow-sm"
                                                            : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black uppercase",
                                                            selectedBatchIds.has(b.id) ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
                                                        )}>
                                                            <LuUsers className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[12px] font-bold leading-tight">{b.name}</span>
                                                            <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">Sem {b.semester} • {b.program || 'Gen'}</span>
                                                        </div>
                                                    </div>
                                                    {selectedBatchIds.has(b.id) && <LuShieldCheck className="w-3.5 h-3.5 text-indigo-400" />}
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].slice(0, (baselineTimetable?.configJson?.daysPerWeek as number) || 6).map((day, idx) => (
                                        <div
                                            key={day}
                                            onClick={() => toggleDayExclusion(idx + 1)}
                                            className={cn(
                                                "group flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all",
                                                excludedDayIds.has(idx + 1)
                                                    ? "bg-red-50/80 border-red-200 text-red-900 shadow-sm"
                                                    : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                                    excludedDayIds.has(idx + 1) ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
                                                )}>
                                                    <LuCalendar className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-semibold">{day}</span>
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-tighter">Full Day Block</span>
                                                </div>
                                            </div>
                                            {excludedDayIds.has(idx + 1) && <LuXCircle className="w-4 h-4 text-red-400" />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>

                        <div className="p-4 bg-slate-50 border-t space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Semester Logic</label>
                                <select
                                    className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                    value={semesterFilter}
                                    onChange={(e) => setSemesterFilter(e.target.value)}
                                >
                                    <option value="all">Full Academic Calendar</option>
                                    <option value="odd">Odd Semesters Only</option>
                                    <option value="even">Even Semesters Only</option>
                                </select>
                            </div>

                            {error && <div className="text-[11px] font-medium text-red-600 bg-red-50 p-2 rounded border border-red-100 mb-2">{error}</div>}

                            <Button
                                className="w-full bg-indigo-600 hover:bg-indigo-700 h-10 shadow-lg shadow-indigo-200 transition-all font-bold text-xs uppercase tracking-wider"
                                onClick={handleGenerateSpecial}
                                disabled={generating || (excludedIds.size === 0 && excludedRoomIds.size === 0)}
                            >
                                {generating ? <><LuLoader2 className="w-4 h-4 mr-2 animate-spin" /> Remapping Engine...</> : <><LuZap className="w-4 h-4 mr-2" /> Generate Special TT</>}
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3 min-h-[calc(100vh-12rem)]">
                    {specialTimetable ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="bg-white p-6 rounded-2xl shadow-xl border border-indigo-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                        <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                                            <LuCalendar className="w-5 h-5" />
                                        </div>
                                        Active Contingency Plan
                                    </h3>
                                    <div className="flex items-center gap-4 mt-2">
                                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-100 py-1 px-3">
                                            <LuUserX className="w-3 h-3 mr-1" />
                                            {excludedIds.size} Substituted Staff
                                        </Badge>
                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 py-1 px-3">
                                            <LuMonitor className="w-3 h-3 mr-1" />
                                            {excludedRoomIds.size} Blocked Rooms
                                        </Badge>
                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 py-1 px-3">
                                            <LuCalendar className="w-3 h-3 mr-1" />
                                            {excludedDayIds.size} Blocked Days
                                        </Badge>
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">
                                            Engine Latency: {specialTimetable.generationMs}ms
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSpecialTimetable(null)}
                                        className="text-xs font-bold"
                                    >
                                        Clear Plan
                                    </Button>
                                    <TimetableExport targetId="special-timetable-grid" filename={`special_tt_${user?.entityId}`} />
                                </div>
                            </div>

                            <div id="special-timetable-grid" className="bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                                <TimetableGrid
                                    slots={specialTimetable.slots}
                                    config={specialTimetable.configJson}
                                    viewMode="admin"
                                    baselineSlots={baselineTimetable?.slots}
                                />
                            </div>

                            <WorkloadSummary slots={specialTimetable.slots} />
                        </div>
                    ) : baselineTimetable ? (
                        <div className="h-full flex flex-col">
                            <Card className="flex-1 flex flex-col items-center justify-center p-12 border-dashed border-2 bg-slate-50/50">
                                <div className="w-24 h-24 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 border border-slate-100 group hover:scale-110 transition-transform duration-500">
                                    <LuZap className="w-10 h-10 text-indigo-200 group-hover:text-indigo-500 transition-colors" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2">Matrix Ready for Generation</h3>
                                <p className="text-slate-500 text-sm max-w-sm text-center mb-8">
                                    A baseline timetable exists. Select exclusions on the left and trigger the AI engine to generate a conflict-free contingency plan.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                                        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                                            <LuUsers className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Baseline Staff</div>
                                            <div className="text-lg font-black text-slate-800">{faculty.length} Assigned</div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                                        <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                                            <LuNetwork className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Active Slots</div>
                                            <div className="text-lg font-black text-slate-800">{baselineTimetable.slots.length} Matrix Blocks</div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">
                            <Card className="flex-1 flex flex-col items-center justify-center p-12 border-dashed border-2 bg-slate-50/50">
                                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                                    <LuTriangleAlert className="w-10 h-10 text-red-300" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2 font-display">No Baseline Matrix Found</h3>
                                <p className="text-slate-500 text-sm max-w-md text-center">
                                    The Special Timetable generator requires an existing active timetable to calculate differences and maintain continuity. Please generate a <span className="font-bold text-slate-800">Regular Timetable</span> first.
                                </p>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};
