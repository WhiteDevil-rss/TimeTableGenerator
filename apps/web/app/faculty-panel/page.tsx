'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { LuUser, LuCalendar, LuClock, LuBookOpen } from 'react-icons/lu';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store/useAuthStore';

export default function FacultyDashboard() {
    const { user } = useAuthStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [facultyData, setFacultyData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const { data } = await api.get(`/faculty/${user?.entityId}`);
            setFacultyData(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user?.entityId]);

    useEffect(() => {
        if (user?.entityId) {
            fetchData();
        }
    }, [user, fetchData]);

    const navItems = [
        { title: 'My Profile', href: '/faculty-panel', icon: <LuUser className="w-5 h-5" /> },
        { title: 'My Schedule', href: '/faculty-panel/schedule', icon: <LuCalendar className="w-5 h-5 text-indigo-500" /> },
    ];

    return (
        <ProtectedRoute allowedRoles={['FACULTY']}>
            <DashboardLayout navItems={navItems} title="Faculty Portal">
                {loading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-indigo-600 dark:border-neon-cyan border-t-transparent animate-spin rounded-full"></div></div>
                ) : facultyData ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Profile Overview */}
                        <Card className="shadow-sm border-slate-200 glass-card dark:border-white/10 dark:bg-[#0a0a0c]">
                            <CardHeader className="bg-slate-50/50 dark:bg-white/5 border-b dark:border-white/10">
                                <CardTitle className="text-xl dark:text-white">Personal Information</CardTitle>
                                <CardDescription className="dark:text-slate-400">Your current details on record</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex justify-between items-center border-b border-dashed dark:border-white/10 pb-2">
                                    <span className="text-slate-500 dark:text-slate-400">Name</span>
                                    <span className="font-medium text-slate-800 dark:text-slate-200">{facultyData.name}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-dashed dark:border-white/10 pb-2">
                                    <span className="text-slate-500 dark:text-slate-400">Email</span>
                                    <span className="font-medium text-slate-800 dark:text-slate-200">{facultyData.email}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-dashed dark:border-white/10 pb-2">
                                    <span className="text-slate-500 dark:text-slate-400">Designation</span>
                                    <span className="font-medium inline-block px-2 bg-blue-50 dark:bg-indigo-900/40 text-blue-700 dark:text-indigo-300 rounded-md">
                                        {facultyData.designation || 'Faculty'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Teaching Subjects */}
                        <Card className="shadow-sm border-slate-200 glass-card dark:border-white/10 dark:bg-[#0a0a0c]">
                            <CardHeader className="bg-slate-50/50 dark:bg-white/5 border-b dark:border-white/10">
                                <CardTitle className="text-xl dark:text-white flex items-center"><LuBookOpen className="w-5 h-5 mr-2 text-indigo-500 dark:text-neon-purple" /> Assigned Subjects</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {facultyData.subjects && facultyData.subjects.length > 0 ? (
                                    <ul className="space-y-3">
                                        {facultyData.subjects.map((sub: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                                            <li key={sub.id} className="flex flex-col p-3 border dark:border-white/10 rounded-lg bg-slate-50 dark:bg-white/5">
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">{sub.course?.name}</span>
                                                <div className="flex justify-between mt-2 text-sm text-slate-500 dark:text-slate-400">
                                                    <span>Code: {sub.course?.code}</span>
                                                    <span className="px-2 py-0.5 rounded text-xs font-medium dark:bg-white/10 bg-slate-200">{sub.isPrimary ? 'Primary' : 'Secondary'}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center p-6 text-slate-500 dark:text-slate-400 border dark:border-white/10 border-dashed rounded-lg bg-slate-50/50 dark:bg-white/5">
                                        No subjects assigned yet.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                    </div>
                ) : (
                    <div className="p-6 text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-500/20 rounded-lg">Failed to load profile data.</div>
                )}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
