'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { LayoutDashboard, Users, BookOpen, Building2, Monitor } from 'lucide-react';
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
        { title: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
        { title: 'Departments', href: '/dashboard/departments', icon: <Building2 className="w-5 h-5" /> },
        { title: 'Faculty', href: '/dashboard/faculty', icon: <Users className="w-5 h-5" /> },
        { title: 'Resources', href: '/dashboard/resources', icon: <Monitor className="w-5 h-5" /> },
    ];

    return (
        <ProtectedRoute allowedRoles={['UNI_ADMIN']}>
            <DashboardLayout navItems={navItems} title="University Admin Dashboard">
                {loading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent animate-spin rounded-full"></div></div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium text-slate-500">Total Departments</CardTitle>
                                <Building2 className="w-4 h-4 text-slate-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.departments}</div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium text-slate-500">Total Faculty</CardTitle>
                                <Users className="w-4 h-4 text-slate-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.faculty}</div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium text-slate-500">Total Subjects</CardTitle>
                                <BookOpen className="w-4 h-4 text-slate-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.courses}</div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium text-slate-500">Total Batches</CardTitle>
                                <Users className="w-4 h-4 text-indigo-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.batches}</div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
