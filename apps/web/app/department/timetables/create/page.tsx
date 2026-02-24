'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { LayoutDashboard, Users, BookOpen, Calendar, Play, Monitor } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function GenerateTimetablePage() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [latestTimetable, setLatestTimetable] = useState<any>(null);
    const [semesterFilter, setSemesterFilter] = useState('all');

    const [config, setConfig] = useState({
        startTime: "09:00",
        endTime: "16:00",
        lectureDuration: 60,
        breakDuration: 60,
        numberOfBreaks: 1,
        daysPerWeek: 5
    });

    const fetchLatestTimetable = useCallback(async () => {
        if (!user?.entityId) return;
        try {
            const response = await api.get(`/departments/${user.entityId}/timetables/latest`);
            setLatestTimetable(response.data);
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
            console.log("No active timetable found, or error fetching.");
        }
    }, [user?.entityId]);

    useEffect(() => {
        fetchLatestTimetable();
    }, [user, fetchLatestTimetable]);

    const handleGenerate = async () => {
        if (!user?.entityId) return;
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.post(`/departments/${user.entityId}/timetables/generate`, {
                departmentId: user.entityId,
                config,
                semesterFilter
            });
            setSuccess(`Success! Timetable generated in ${response.data.timetable.generationMs}ms.`);
            await fetchLatestTimetable(); // Refresh view
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err.response?.data?.error || err.message || 'Failed to generate timetable.');
        } finally {
            setLoading(false);
        }
    };

    const navItems = [
        { title: 'Dashboard', href: '/department', icon: <LayoutDashboard className="w-5 h-5" /> },
        { title: 'Faculty', href: '/department/faculty', icon: <Users className="w-5 h-5" /> },
        { title: 'Courses', href: '/department/courses', icon: <BookOpen className="w-5 h-5" /> },
        { title: 'Subjects', href: '/department/subjects', icon: <BookOpen className="w-5 h-5" /> },
        { title: 'Batches', href: '/department/batches', icon: <Users className="w-5 h-5" /> },
        { title: 'Resources', href: '/department/resources', icon: <Monitor className="w-5 h-5" /> },
        { title: 'Timetables', href: '/department/timetables', icon: <Calendar className="w-5 h-5 text-indigo-500" /> },
    ];

    return (
        <ProtectedRoute allowedRoles={['DEPT_ADMIN']}>
            <DashboardLayout navItems={navItems} title="Create New Timetable">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 print:hidden">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl">Generate Timetable</CardTitle>
                            <CardDescription>Configure global parameters and trigger the AI scheduler.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {error && <div className="p-3 bg-red-50 text-red-600 rounded text-sm font-medium">{error}</div>}
                            {success && (
                                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="text-emerald-800 font-medium">
                                        {success}
                                    </div>
                                    <Link href="/department/timetables/view">
                                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">View Timetable</Button>
                                    </Link>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Start Time</label>
                                    <Input
                                        type="time"
                                        value={config.startTime}
                                        onChange={(e) => setConfig({ ...config, startTime: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">End Time</label>
                                    <Input
                                        type="time"
                                        value={config.endTime}
                                        onChange={(e) => setConfig({ ...config, endTime: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Lecture Duration (mins)</label>
                                    <Input
                                        type="number"
                                        min="15" max="180" step="15"
                                        value={config.lectureDuration}
                                        onChange={(e) => setConfig({ ...config, lectureDuration: parseInt(e.target.value) || 60 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Break Duration (mins)</label>
                                    <Input
                                        type="number"
                                        min="0" max="120" step="5"
                                        value={config.breakDuration}
                                        onChange={(e) => setConfig({ ...config, breakDuration: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Number of Breaks</label>
                                    <Input
                                        type="number"
                                        min="0" max="5"
                                        value={config.numberOfBreaks}
                                        onChange={(e) => setConfig({ ...config, numberOfBreaks: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Working Days (Per Week)</label>
                                    <Input
                                        type="number"
                                        min="1" max="7"
                                        value={config.daysPerWeek}
                                        onChange={(e) => setConfig({ ...config, daysPerWeek: parseInt(e.target.value) || 5 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Semester Filter</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={semesterFilter}
                                        onChange={(e) => setSemesterFilter(e.target.value)}
                                    >
                                        <option value="all">All Semesters</option>
                                        <option value="odd">Odd Semesters Only (1, 3, 5...)</option>
                                        <option value="even">Even Semesters Only (2, 4, 6...)</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 border-t p-6">
                            <Button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                ) : (
                                    <Play className="w-5 h-5 mr-2" />
                                )}
                                {loading ? 'Solving Constraints...' : 'Generate New Timetable'}
                            </Button>
                        </CardFooter>
                    </Card>

                    <div className="space-y-6">
                        <Card className="bg-indigo-50 border-indigo-100 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-indigo-900 text-lg">AI Engine Status</CardTitle>
                                <CardDescription className="text-indigo-700">The scheduler utilizes Google OR-Tools CP-SAT to resolve overlapping matrix constraints in real-time.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-indigo-800">Solver Latency Limit</span>
                                    <span className="font-semibold text-indigo-900 bg-indigo-200/50 px-2 rounded">30,000 ms</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-indigo-800">Concurrency Safelock</span>
                                    <span className="font-semibold text-emerald-700 bg-emerald-100 px-2 rounded">Redis Distributed</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-indigo-800">Constraints</span>
                                    <span className="font-semibold text-indigo-900 bg-indigo-200/50 px-2 rounded">9 Active</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
