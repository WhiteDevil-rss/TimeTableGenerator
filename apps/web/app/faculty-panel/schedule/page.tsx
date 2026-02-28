'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { LuUser, LuCalendar } from 'react-icons/lu';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { TimetableGrid } from '@/components/timetable/timetable-grid';

export default function FacultySchedulePage() {
    const { user } = useAuthStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [latestTimetable, setLatestTimetable] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchSchedule = useCallback(async () => {
        try {
            // Fetch the faculty profile to get their associated departmentId
            const facultyRes = await api.get(`/faculty/${user!.entityId}`);
            const departmentId = facultyRes.data.departmentId;

            // Now fetch the department's latest timetable
            const response = await api.get(`/departments/${departmentId}/timetables/latest?facultyId=${user!.entityId}`);
            setLatestTimetable(response.data);
        } catch (e) { // eslint-disable-line @typescript-eslint/no-unused-vars
            console.log("No active schedule found for you.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        // We only load if the user is authenticated and is a faculty member with an entityId
        if (user?.role === 'FACULTY' && user?.entityId) {
            fetchSchedule();
        }
    }, [user, fetchSchedule]);

    const navItems = [
        { title: 'My Profile', href: '/faculty-panel', icon: <LuUser className="w-5 h-5" /> },
        { title: 'My Schedule', href: '/faculty-panel/schedule', icon: <LuCalendar className="w-5 h-5 text-indigo-500" /> },
    ];

    return (
        <ProtectedRoute allowedRoles={['FACULTY']}>
            <DashboardLayout navItems={navItems} title="My Schedule">
                {loading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
                ) : latestTimetable ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Your Current Schedule</h3>
                                <p className="text-sm text-slate-500">
                                    Generated on {new Date(latestTimetable.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <TimetableGrid
                            slots={latestTimetable.slots}
                            config={latestTimetable.configJson}
                            viewMode="faculty"
                            facultyId={user!.entityId!}
                        />
                    </div>
                ) : (
                    <div className="text-center p-12 border border-dashed rounded-xl bg-slate-50">
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">No active schedule found</h3>
                        <p className="text-slate-500">Your specific department has not generated or published an active timetable yet.</p>
                    </div>
                )}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
