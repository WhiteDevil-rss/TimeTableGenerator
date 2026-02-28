'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { LuLayoutDashboard, LuUsers, LuBookOpen, LuBuilding2, LuMonitor } from 'react-icons/lu';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store/useAuthStore';

export default function UniAdminDashboard() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState({ departments: 0, faculty: 0, courses: 0, batches: 0 });
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [deptRes, facRes, crsRes, bchRes] = await Promise.all([
                api.get(`/universities/${user?.universityId}/departments`),
                api.get(`/faculty`),
                api.get(`/courses`),
                api.get(`/batches`),
            ]);
            setStats({
                departments: deptRes.data.length,
                faculty: facRes.data.length,
                courses: crsRes.data.length,
                batches: bchRes.data.length,
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user?.universityId]);

    useEffect(() => {
        if (user?.universityId) {
            fetchData();
        }
    }, [user, fetchData]);

    const navItems = [
        { title: 'Dashboard', href: '/dashboard', icon: <LuLayoutDashboard className="w-5 h-5" /> },
        { title: 'Departments', href: '/dashboard/departments', icon: <LuBuilding2 className="w-5 h-5" /> },
        { title: 'Faculty', href: '/dashboard/faculty', icon: <LuUsers className="w-5 h-5" /> },
        { title: 'Resources', href: '/dashboard/resources', icon: <LuMonitor className="w-5 h-5" /> },
    ];

    return (
        <ProtectedRoute allowedRoles={['UNI_ADMIN']}>
            <DashboardLayout navItems={navItems} title="University Admin Dashboard">
                {loading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent animate-spin rounded-full"></div></div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden border-slate-200/60">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                                <CardTitle className="text-sm font-semibold text-slate-600">Total Departments</CardTitle>
                                <div className="p-2 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                                    <LuBuilding2 className="w-5 h-5 text-blue-600" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-extrabold text-slate-800 tracking-tight">{stats.departments}</div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden border-slate-200/60">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                                <CardTitle className="text-sm font-semibold text-slate-600">Total Faculty</CardTitle>
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
                                <CardTitle className="text-sm font-semibold text-slate-600">Total Subjects</CardTitle>
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
                                <CardTitle className="text-sm font-semibold text-slate-600">Total Batches</CardTitle>
                                <div className="p-2 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                                    <LuUsers className="w-5 h-5 text-emerald-600" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-extrabold text-slate-800 tracking-tight">{stats.batches}</div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
