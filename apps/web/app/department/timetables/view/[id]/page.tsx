'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { LuLayoutDashboard, LuUsers, LuBookOpen, LuCalendar, LuMonitor, LuGraduationCap, LuNetwork, LuTriangleAlert, LuArrowLeft } from 'react-icons/lu';
import { useState, useEffect, useCallback, use } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { TimetableGrid } from '@/components/timetable/timetable-grid';
import { WorkloadSummary } from '@/components/timetable/workload-summary';
import { TimetableExport } from '@/components/timetable/timetable-export';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { WorkloadChart } from '@/components/timetable/workload-chart';
import { Badge } from '@/components/ui/badge';

export default function TimetableDetailView({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [timetable, setTimetable] = useState<any>(null);

    const fetchTimetable = useCallback(async () => {
        if (!user?.entityId) return;
        setLoading(true);
        try {
            const response = await api.get(`/departments/${user.entityId}/timetables/${id}`);
            setTimetable(response.data);
        } catch {
            console.error("Error fetching timetable details.");
            setTimetable(null);
        } finally {
            setLoading(false);
        }
    }, [user?.entityId, id]);

    useEffect(() => {
        fetchTimetable();
    }, [fetchTimetable]);

    const navItems = [
        { title: 'Dashboard', href: '/department', icon: <LuLayoutDashboard className="w-5 h-5" /> },
        { title: 'Faculty', href: '/department/faculty', icon: <LuUsers className="w-5 h-5" /> },
        { title: 'Courses', href: '/department/courses', icon: <LuGraduationCap className="w-5 h-5" /> },
        { title: 'Subjects', href: '/department/subjects', icon: <LuBookOpen className="w-5 h-5" /> },
        { title: 'Batches', href: '/department/batches', icon: <LuNetwork className="w-5 h-5" /> },
        { title: 'Resources', href: '/department/resources', icon: <LuMonitor className="w-5 h-5" /> },
        { title: 'Timetables', href: '/department/timetables', icon: <LuCalendar className="w-5 h-5 text-indigo-500" /> },
    ];

    return (
        <ProtectedRoute allowedRoles={['DEPT_ADMIN']}>
            <DashboardLayout navItems={navItems} title="Timetable Details">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-4">
                        <Link href="/department/timetables/view">
                            <Button variant="ghost" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5">
                                <LuArrowLeft className="w-4 h-4 mr-2" /> Back to Timetables List
                            </Button>
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : timetable ? (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center glass-card p-6 rounded-xl shadow-sm border-slate-200 dark:border-white/10 print:hidden gap-4 relative overflow-hidden">
                                <div className="absolute top-0 right-[-10%] w-[40%] h-[120%] bg-neon-cyan/5 dark:bg-neon-cyan/5 blur-[50px] rounded-full pointer-events-none" />
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                                        {timetable.isSpecial ? (
                                            <span className="flex items-center gap-2 text-neon-purple dark:text-neon-purple drop-shadow-[0_0_8px_rgba(184,84,245,0.4)]">
                                                <LuTriangleAlert className="w-6 h-6" /> Special Contingency Schedule
                                            </span>
                                        ) : (
                                            "Department Master Schedule"
                                        )}
                                    </h3>
                                    <div className="text-slate-500 dark:text-slate-400 mt-1.5 flex flex-wrap items-center gap-2">
                                        <Badge variant="outline" className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest ${timetable.status === 'ACTIVE' ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30 shadow-[0_0_10px_rgba(57,193,239,0.2)]' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10'}`}>
                                            {timetable.status}
                                        </Badge>
                                        <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 mx-1" />
                                        <span className="text-xs font-medium bg-slate-50 dark:bg-slate-900/50 px-2 py-0.5 rounded border border-slate-100 dark:border-white/5">Generated in {timetable.generationMs}ms</span>
                                        <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 mx-1" />
                                        <span className="text-xs text-slate-400 font-medium">{timetable.slots.length} assignments tracked.</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 relative z-10">
                                    <TimetableExport targetId="printable-view-timetable" filename={`timetable_${id}`} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                                <div className="lg:col-span-3">
                                    <WorkloadChart slots={timetable.slots} />
                                </div>
                                <div className="lg:col-span-2">
                                    <WorkloadSummary slots={timetable.slots} />
                                </div>
                            </div>

                            <Card className="border-0 shadow-2xl overflow-hidden rounded-2xl glass-card">
                                <CardContent className="p-0">
                                    <div id="printable-view-timetable" className="bg-white dark:bg-slate-900">
                                        <TimetableGrid
                                            slots={timetable.slots}
                                            config={timetable.configJson}
                                            viewMode="admin"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 glass-card border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl text-center">
                            <LuCalendar className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Timetable Not Found</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-md">
                                The timetable parameter could not be retrieved or it does not exist.
                            </p>
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
