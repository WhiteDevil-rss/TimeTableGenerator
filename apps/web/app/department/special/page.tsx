'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Users, BookOpen, UserX, Loader2, LayoutDashboard, GraduationCap, Network, Calendar, Monitor, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import { TimetableGrid } from '@/components/timetable/timetable-grid';
import { WorkloadSummary } from '@/components/timetable/workload-summary';
import { TimetableExport } from '@/components/timetable/timetable-export';

export default function SpecialTimetablePage() {
    const { user } = useAuthStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [faculty, setFaculty] = useState<any[]>([]);
    const [resources, setResources] = useState<any[]>([]);
    const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
    const [excludedRoomIds, setExcludedRoomIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const [semesterFilter, setSemesterFilter] = useState('all');

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

    const toggleExclusion = (id: string, type: 'faculty' | 'room') => {
        if (type === 'faculty') {
            const next = new Set(excludedIds);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            setExcludedIds(next);
        } else {
            const next = new Set(excludedRoomIds);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            setExcludedRoomIds(next);
        }
    };

    const handleGenerateSpecial = async () => {
        if (excludedIds.size === 0 && excludedRoomIds.size === 0) {
            setError("Please select at least one faculty member or resource to exclude.");
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

    const navItems = [
        { title: 'Dashboard', href: '/department', icon: <LayoutDashboard className="w-5 h-5" /> },
        { title: 'Faculty', href: '/department/faculty', icon: <Users className="w-5 h-5" /> },
        { title: 'Programs', href: '/department/courses', icon: <GraduationCap className="w-5 h-5" /> },
        { title: 'Subjects', href: '/department/subjects', icon: <BookOpen className="w-5 h-5" /> },
        { title: 'Batches', href: '/department/batches', icon: <Network className="w-5 h-5" /> },
        { title: 'Resources', href: '/department/resources', icon: <Monitor className="w-5 h-5" /> },
        { title: 'Timetables', href: '/department/timetables', icon: <Calendar className="w-5 h-5" /> },
        { title: 'Special TT', href: '/department/special', icon: <Zap className="w-5 h-5 text-amber-500" /> },
    ];

    if (loading) return <DashboardLayout navItems={navItems} title="Special Schedule" ><div className="p-8">Loading configuration...</div></DashboardLayout>;

    return (
        <DashboardLayout navItems={navItems} title="Generate Special Timetable">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-amber-200 bg-amber-50/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-amber-800">
                                <AlertTriangle className="w-5 h-5" />
                                Emergency Exclusions
                            </CardTitle>
                            <CardDescription className="text-amber-700/80">
                                Select unavailable faculty members or rooms. The AI will attempt to reconstruct the active timetable using remaining available staff and resource capacity.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                                {/* Faculty Exclusions List */}
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 mb-3 border-b pb-2">Faculty Exclusions</h4>
                                    <div className="space-y-2">
                                        {faculty.map(f => (
                                            <label key={f.id} className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${excludedIds.has(f.id) ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                                <div className="flex items-center gap-3">
                                                    <UserX className={`w-4 h-4 ${excludedIds.has(f.id) ? 'text-red-500' : 'text-slate-400'}`} />
                                                    <span className="font-medium text-sm">{f.name}</span>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300 rounded"
                                                    checked={excludedIds.has(f.id)}
                                                    onChange={() => toggleExclusion(f.id, 'faculty')}
                                                />
                                            </label>
                                        ))}
                                        {faculty.length === 0 && <p className="text-xs text-slate-500 italic">No faculty available.</p>}
                                    </div>
                                </div>

                                {/* Resource Exclusions List */}
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 mb-3 border-b pb-2">Classroom & Lab Exclusions</h4>
                                    <div className="space-y-2">
                                        {resources.map(r => (
                                            <label key={r.id} className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${excludedRoomIds.has(r.id) ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                                <div className="flex items-center gap-3">
                                                    <Monitor className={`w-4 h-4 ${excludedRoomIds.has(r.id) ? 'text-red-500' : 'text-slate-400'}`} />
                                                    <span className="font-medium text-sm">{r.name} <span className="text-xs text-slate-500">({r.type})</span></span>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300 rounded"
                                                    checked={excludedRoomIds.has(r.id)}
                                                    onChange={() => toggleExclusion(r.id, 'room')}
                                                />
                                            </label>
                                        ))}
                                        {resources.length === 0 && <p className="text-xs text-slate-500 italic">No resources available.</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 mt-6 mb-4">
                                <label className="text-sm font-medium text-amber-900">Semester Batch Filter</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                    value={semesterFilter}
                                    onChange={(e) => setSemesterFilter(e.target.value)}
                                >
                                    <option value="all">All Active Semesters</option>
                                    <option value="odd">Odd Semesters (1, 3, 5...)</option>
                                    <option value="even">Even Semesters (2, 4, 6...)</option>
                                </select>
                            </div>

                            {error && <div className="text-red-600 text-sm mb-4 p-3 bg-red-50 rounded-md border border-red-100">{error}</div>}

                            <Button
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                                onClick={handleGenerateSpecial}
                                disabled={generating || (excludedIds.size === 0 && excludedRoomIds.size === 0)}
                            >
                                {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Remapping...</> : <><Zap className="w-4 h-4 mr-2" /> Generate Substitution Matrix</>}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    {specialTimetable ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-amber-200">
                                <div>
                                    <h3 className="text-lg font-bold text-amber-800 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        Special Contingency Active
                                    </h3>
                                    <div className="text-sm text-slate-500 mt-1">
                                        Substituted {excludedIds.size} faculty, {excludedRoomIds.size} rooms. Generated in {specialTimetable.generationMs}ms.
                                    </div>
                                </div>
                                <TimetableExport targetId="special-timetable-grid" filename={`emergency_tt_${user?.entityId}`} />
                            </div>

                            <div id="special-timetable-grid" className="bg-white p-2 border-2 border-amber-200 rounded-lg">
                                {/* Using existing Grid component. For MVP Phase 5 differences will just be visually inferred by changed names/classes, a dedicated comparative overlay requires more robust structural diffing. */}
                                <TimetableGrid
                                    slots={specialTimetable.slots}
                                    config={specialTimetable.configJson}
                                    viewMode="admin"
                                />
                            </div>

                            <WorkloadSummary slots={specialTimetable.slots} />
                        </div>
                    ) : baselineTimetable ? (
                        <Card className="h-full flex flex-col items-center justify-center min-h-[400px] border-slate-200 text-slate-400">
                            <BookOpen className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm">Select exclusions and generate to view contingency matrix.</p>
                            <p className="text-xs mt-2 opacity-60"> Baseline timetable active ({baselineTimetable.slots.length} assignments)</p>
                        </Card>
                    ) : (
                        <Card className="h-full flex flex-col items-center justify-center min-h-[400px] border-slate-200 text-slate-400">
                            <AlertTriangle className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm">No baseline timetable found. Generate a primary timetable first.</p>
                        </Card>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
