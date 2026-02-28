'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { LuUsers, LuBookOpen, LuCalendar } from 'react-icons/lu';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { WorkloadChart } from '@/components/timetable/workload-chart';

import { DEPT_ADMIN_NAV } from '@/lib/constants/nav-config';

interface Timetable {
    id: string;
    slots: Record<string, unknown>[];
}

export default function DeptAdminDashboard() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState({ faculty: 0, courses: 0, batches: 0 });
    const [loading, setLoading] = useState(true);
    const [latestTimetable, setLatestTimetable] = useState<Timetable | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [facRes, crsRes, bchRes, ttRes] = await Promise.all([
                api.get(`/faculty`),
                api.get(`/courses`),
                api.get(`/batches`),
                api.get(`/departments/${user!.entityId}/timetables/latest`).catch(() => ({ data: null }))
            ]);
            setStats({
                faculty: facRes.data.length,
                courses: crsRes.data.length,
                batches: bchRes.data.length,
            });
            if (ttRes.data) {
                setLatestTimetable(ttRes.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user?.entityId) {
            fetchData();
        }
    }, [user?.entityId, fetchData]);

    return (
        <ProtectedRoute allowedRoles={['DEPT_ADMIN']}>
            <DashboardLayout navItems={DEPT_ADMIN_NAV} title="Department Admin Dashboard">
                {loading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent animate-spin rounded-full"></div></div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden border-slate-200/60">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                                    <CardTitle className="text-sm font-semibold text-slate-600">Department Faculty</CardTitle>
                                    <div className="p-2 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
                                        <LuUsers className="w-5 h-5 text-indigo-600" />
                                    </div>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="text-3xl font-extrabold text-slate-800 tracking-tight">{stats.faculty}</div>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden border-slate-200/60">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                                    <CardTitle className="text-sm font-semibold text-slate-600">Department Subjects</CardTitle>
                                    <div className="p-2 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                                        <LuBookOpen className="w-5 h-5 text-purple-600" />
                                    </div>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="text-3xl font-extrabold text-slate-800 tracking-tight">{stats.courses}</div>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden border-slate-200/60">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                                    <CardTitle className="text-sm font-semibold text-slate-600">Active Batches</CardTitle>
                                    <div className="p-2 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                                        <LuUsers className="w-5 h-5 text-emerald-600" />
                                    </div>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="text-3xl font-extrabold text-slate-800 tracking-tight">{stats.batches}</div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="mt-8">
                            <h2 className="text-xl font-bold text-slate-800 mb-4">Latest Workload Summary</h2>
                            {latestTimetable ? (
                                <WorkloadChart slots={latestTimetable.slots} />
                            ) : (
                                <Card className="bg-slate-50 border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center p-8 text-slate-500">
                                        <LuCalendar className="w-12 h-12 text-slate-300 mb-3" />
                                        <p>No active timetable generated yet.</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </>
                )}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
