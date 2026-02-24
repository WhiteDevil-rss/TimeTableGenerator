'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { LayoutDashboard, Users, BookOpen, Calendar, GraduationCap, Network, Monitor, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { WorkloadChart } from '@/components/timetable/workload-chart';

export default function DeptAdminDashboard() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState({ faculty: 0, courses: 0, batches: 0 });
    const [loading, setLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [latestTimetable, setLatestTimetable] = useState<any>(null);

    useEffect(() => {
        if (user?.entityId) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const [facRes, crsRes, bchRes, ttRes] = await Promise.all([
                api.get(`/faculty`),
                api.get(`/subjects`),
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
    };

    const navItems = [
        { title: 'Dashboard', href: '/department', icon: <LayoutDashboard className="w-5 h-5 text-indigo-500" /> },
        { title: 'Faculty', href: '/department/faculty', icon: <Users className="w-5 h-5" /> },
        { title: 'Courses', href: '/department/courses', icon: <GraduationCap className="w-5 h-5" /> },
        { title: 'Subjects', href: '/department/subjects', icon: <BookOpen className="w-5 h-5" /> },
        { title: 'Batches', href: '/department/batches', icon: <Network className="w-5 h-5" /> },
        { title: 'Resources', href: '/department/resources', icon: <Monitor className="w-5 h-5" /> },
        { title: 'Timetables', href: '/department/timetables', icon: <Calendar className="w-5 h-5" /> },
    ];

    return (
        <ProtectedRoute allowedRoles={['DEPT_ADMIN']}>
            <DashboardLayout navItems={navItems} title="Department Admin Dashboard">
                {loading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent animate-spin rounded-full"></div></div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                    <CardTitle className="text-sm font-medium text-slate-500">Department Faculty</CardTitle>
                                    <Users className="w-4 h-4 text-slate-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.faculty}</div>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                    <CardTitle className="text-sm font-medium text-slate-500">Department Subjects</CardTitle>
                                    <BookOpen className="w-4 h-4 text-slate-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.courses}</div>¸
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                    <CardTitle className="text-sm font-medium text-slate-500">Active Batches</CardTitle>
                                    <Users className="w-4 h-4 text-indigo-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.batches}</div>
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
                                        <Calendar className="w-12 h-12 text-slate-300 mb-3" />
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
