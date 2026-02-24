'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Users, BookOpen, UserX, Loader2, LayoutDashboard, GraduationCap, Network, Calendar, Monitor, Zap, Search, ChevronRight, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { TimetableGrid } from '@/components/timetable/timetable-grid';
import { WorkloadSummary } from '@/components/timetable/workload-summary';
import { TimetableExport } from '@/components/timetable/timetable-export';
import { DEPT_ADMIN_NAV } from '@/lib/constants/nav-config';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function SpecialTimetablePage() {
    const { user } = useAuthStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [faculty, setFaculty] = useState<any[]>([]);
    const [resources, setResources] = useState<any[]>([]);
    const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
    const [excludedRoomIds, setExcludedRoomIds] = useState<Set<string>>(new Set());
    const [excludedDayIds, setExcludedDayIds] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const [semesterFilter, setSemesterFilter] = useState('all');
    const [activeTab, setActiveTab] = useState<'faculty' | 'resources' | 'days'>('faculty');
    const [facultySearch, setFacultySearch] = useState('');
    const [resourceSearch, setResourceSearch] = useState('');

    // Result views
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [specialTimetable, setSpecialTimetable] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [baselineTimetable, setBaselineTimetable] = useState<any>(null);

    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const [facRes, resRes] = await Promise.all([
                api.get(`/faculty`), // DEPT_ADMIN auto-scoped by backend to their department
                api.get(`/resources`), // university-wide resources
            ]);
            setFaculty(facRes.data);
            setResources(resRes.data);
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError('Failed to load faculty and resources. Please refresh.');
        }

        // Fetch latest timetable separately so a 404 is non-fatal
        try {
            const ttRes = await api.get(`/departments/${user!.entityId}/timetables/latest`);
            setBaselineTimetable(ttRes.data);
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            if (err.response?.status !== 404) {
                console.warn('Could not load baseline timetable:', err.message);
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

    const toggleExclusion = (id: any, type: 'faculty' | 'room' | 'day') => {
        if (type === 'faculty') {
            const next = new Set(excludedIds);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            setExcludedIds(next);
        } else if (type === 'room') {
            const next = new Set(excludedRoomIds);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            setExcludedRoomIds(next);
        } else {
            const next = new Set(excludedDayIds);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            setExcludedDayIds(next);
        }
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
                semesterFilter
            };

            const response = await api.post(`/departments/${user!.entityId}/timetables/generate`, payload);
            setSpecialTimetable(response.data.timetable);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            if (err.response?.status === 422) {
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
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
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
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                Exclusions
                            </CardTitle>
                            <CardDescription className="text-xs leading-relaxed">
                                Select staff or rooms unavailable for the contingency matrix.
                            </CardDescription>
                        </CardHeader>

                        {/* Custom Tabs */}
                        <div className="flex border-b">
                            <button
                                onClick={() => setActiveTab('faculty')}
                                className={cn(
                                    "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2",
                                    activeTab === 'faculty' ? "border-indigo-500 text-indigo-600 bg-white" : "border-transparent text-slate-400 hover:text-slate-600 bg-slate-50/30"
                                )}
                            >
                                Faculty <Badge variant="secondary" className="ml-1 px-1.5 py-0 min-w-[1.2rem] h-4 bg-slate-100">{excludedIds.size}</Badge>
                            </button>
                            <button
                                onClick={() => setActiveTab('resources')}
                                className={cn(
                                    "flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2",
                                    activeTab === 'resources' ? "border-indigo-500 text-indigo-600 bg-white" : "border-transparent text-slate-400 hover:text-slate-600 bg-slate-50/30"
                                )}
                            >
                                Rooms <Badge variant="secondary" className="ml-0.5 px-1 py-0 min-w-[1rem] h-3.5 bg-slate-100">{excludedRoomIds.size}</Badge>
                            </button>
                            <button
                                onClick={() => setActiveTab('days')}
                                className={cn(
                                    "flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2",
                                    activeTab === 'days' ? "border-indigo-500 text-indigo-600 bg-white" : "border-transparent text-slate-400 hover:text-slate-600 bg-slate-50/30"
                                )}
                            >
                                Days <Badge variant="secondary" className="ml-0.5 px-1 py-0 min-w-[1rem] h-3.5 bg-slate-100">{excludedDayIds.size}</Badge>
                            </button>
                        </div>

                        {activeTab !== 'days' && (
                            <div className="p-3 border-b bg-white">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder={activeTab === 'faculty' ? "Search faculty..." : "Search rooms..."}
                                        className="pl-9 h-9 text-xs"
                                        value={activeTab === 'faculty' ? facultySearch : resourceSearch}
                                        onChange={(e) => activeTab === 'faculty' ? setFacultySearch(e.target.value) : setResourceSearch(e.target.value)}
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
                                            onClick={() => toggleExclusion(f.id, 'faculty')}
                                            className={cn(
                                                "group flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all",
                                                excludedIds.has(f.id)
                                                    ? "bg-red-50/80 border-red-200 text-red-900 shadow-sm"
                                                    : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                                    excludedIds.has(f.id) ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
                                                )}>
                                                    {f.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-semibold">{f.name}</span>
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-tighter">{f.designation || 'Staff'}</span>
                                                </div>
                                            </div>
                                            {excludedIds.has(f.id) && <XCircle className="w-4 h-4 text-red-400" />}
                                        </div>
                                    ))}
                                    {filteredFaculty.length === 0 && <div className="p-8 text-center text-slate-400 text-xs italic">No matching faculty found.</div>}
                                </div>
                            ) : activeTab === 'resources' ? (
                                <div className="space-y-1">
                                    {filteredResources.map(r => (
                                        <div
                                            key={r.id}
                                            onClick={() => toggleExclusion(r.id, 'room')}
                                            className={cn(
                                                "group flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all",
                                                excludedRoomIds.has(r.id)
                                                    ? "bg-red-50/80 border-red-200 text-red-900 shadow-sm"
                                                    : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                                    excludedRoomIds.has(r.id) ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
                                                )}>
                                                    <Monitor className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-semibold">{r.name}</span>
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-tighter">{r.type} • {r.building || 'Main'}</span>
                                                </div>
                                            </div>
                                            {excludedRoomIds.has(r.id) && <XCircle className="w-4 h-4 text-red-400" />}
                                        </div>
                                    ))}
                                    {filteredResources.length === 0 && <div className="p-8 text-center text-slate-400 text-xs italic">No matching rooms found.</div>}
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].slice(0, baselineTimetable?.configJson?.daysPerWeek || 6).map((day, idx) => (
                                        <div
                                            key={day}
                                            onClick={() => toggleExclusion(idx + 1, 'day')}
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
                                                    <Calendar className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-semibold">{day}</span>
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-tighter">Full Day Block</span>
                                                </div>
                                            </div>
                                            {excludedDayIds.has(idx + 1) && <XCircle className="w-4 h-4 text-red-400" />}
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
                                {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Remapping Engine...</> : <><Zap className="w-4 h-4 mr-2" /> Generate Special TT</>}
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
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        Active Contingency Plan
                                    </h3>
                                    <div className="flex items-center gap-4 mt-2">
                                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-100 py-1 px-3">
                                            <UserX className="w-3 h-3 mr-1" />
                                            {excludedIds.size} Substituted Staff
                                        </Badge>
                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 py-1 px-3">
                                            <Monitor className="w-3 h-3 mr-1" />
                                            {excludedRoomIds.size} Blocked Rooms
                                        </Badge>
                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 py-1 px-3">
                                            <Calendar className="w-3 h-3 mr-1" />
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
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    baselineSlots={baselineTimetable?.slots}
                                />
                            </div>

                            <WorkloadSummary slots={specialTimetable.slots} />
                        </div>
                    ) : baselineTimetable ? (
                        <div className="h-full flex flex-col">
                            <Card className="flex-1 flex flex-col items-center justify-center p-12 border-dashed border-2 bg-slate-50/50">
                                <div className="w-24 h-24 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 border border-slate-100 group hover:scale-110 transition-transform duration-500">
                                    <Zap className="w-10 h-10 text-indigo-200 group-hover:text-indigo-500 transition-colors" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2">Matrix Ready for Generation</h3>
                                <p className="text-slate-500 text-sm max-w-sm text-center mb-8">
                                    A baseline timetable exists. Select exclusions on the left and trigger the AI engine to generate a conflict-free contingency plan.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                                        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Baseline Staff</div>
                                            <div className="text-lg font-black text-slate-800">{faculty.length} Assigned</div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                                        <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                                            <Network className="w-5 h-5" />
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
                                    <AlertTriangle className="w-10 h-10 text-red-300" />
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
