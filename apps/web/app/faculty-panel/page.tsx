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
                    <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent animate-spin rounded-full"></div></div>
                ) : facultyData ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Profile Overview */}
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="bg-slate-50/50 border-b">
                                <CardTitle className="text-xl">Personal Information</CardTitle>
                                <CardDescription>Your current details on record</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex justify-between items-center border-b border-dashed pb-2">
                                    <span className="text-slate-500">Name</span>
                                    <span className="font-medium text-slate-800">{facultyData.name}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-dashed pb-2">
                                    <span className="text-slate-500">Email</span>
                                    <span className="font-medium text-slate-800">{facultyData.email}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-dashed pb-2">
                                    <span className="text-slate-500">Designation</span>
                                    <span className="font-medium inline-block px-2 bg-blue-50 text-blue-700 rounded-md">
                                        {facultyData.designation || 'Faculty'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pb-2">
                                    <span className="text-slate-500">Max Workload</span>
                                    <span className="font-medium text-slate-800 flex items-center">
                                        <LuClock className="w-4 h-4 mr-2" />
                                        {facultyData.maxHrsPerWeek} hrs/week
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Teaching Subjects */}
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="bg-slate-50/50 border-b">
                                <CardTitle className="text-xl flex items-center"><LuBookOpen className="w-5 h-5 mr-2 text-primary" /> Assigned Subjects</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {facultyData.subjects && facultyData.subjects.length > 0 ? (
                                    <ul className="space-y-3">
                                        {facultyData.subjects.map((sub: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                                            <li key={sub.id} className="flex flex-col p-3 border rounded-lg bg-slate-50">
                                                <span className="font-semibold text-slate-800">{sub.course?.name}</span>
                                                <div className="flex justify-between mt-2 text-sm text-slate-500">
                                                    <span>Code: {sub.course?.code}</span>
                                                    <span>{sub.isPrimary ? 'Primary' : 'Secondary'}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center p-6 text-slate-500 border border-dashed rounded-lg">
                                        No subjects assigned yet.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                    </div>
                ) : (
                    <div className="p-6 text-center text-red-500 bg-red-50 rounded-lg">Failed to load profile data.</div>
                )}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
