'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { LuLayoutDashboard, LuUsers, LuBookOpen, LuCalendar, LuMonitor, LuGraduationCap, LuNetwork, LuFileText, LuTriangleAlert, LuEye, LuClock } from 'react-icons/lu';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function TimetableListPage() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [timetables, setTimetables] = useState<any[]>([]);

    const fetchTimetables = useCallback(async () => {
        if (!user?.entityId) return;
        setLoading(true);
        try {
            const response = await api.get(`/departments/${user.entityId}/timetables`);
            setTimetables(response.data);
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
            console.error("Error fetching timetables history.");
            setTimetables([]);
        } finally {
            setLoading(false);
        }
    }, [user?.entityId]);

    useEffect(() => {
        fetchTimetables();
    }, [user, fetchTimetables]);

    const navItems = [
        { title: 'Dashboard', href: '/department', icon: <LuLayoutDashboard className="w-5 h-5" /> },
        { title: 'Faculty', href: '/department/faculty', icon: <LuUsers className="w-5 h-5" /> },
        { title: 'Courses', href: '/department/courses', icon: <LuGraduationCap className="w-5 h-5" /> },
        { title: 'Subjects', href: '/department/subjects', icon: <LuBookOpen className="w-5 h-5" /> },
        { title: 'Batches', href: '/department/batches', icon: <LuNetwork className="w-5 h-5" /> },
        { title: 'Resources', href: '/department/resources', icon: <LuMonitor className="w-5 h-5" /> },
        { title: 'Timetables', href: '/department/timetables', icon: <LuCalendar className="w-5 h-5 text-indigo-500" /> },
    ];

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getFileName = (tt: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const d = new Date(tt.createdAt);
        const datePart = d.toISOString().split('T')[0];
        const timePart = d.toTimeString().split(' ')[0].replace(/:/g, '-');
        const prefix = tt.isSpecial ? 'EMERGENCY' : 'PRIMARY';
        return `${prefix}_TT_${datePart}_${timePart}`;
    };

    return (
        <ProtectedRoute allowedRoles={['DEPT_ADMIN']}>
            <DashboardLayout navItems={navItems} title="Generated Timetables History">
                <div className="max-w-7xl mx-auto space-y-6">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50/50 border-b pb-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-xl font-bold text-slate-800">Timetable Archive</CardTitle>
                                    <CardDescription>View and access all previously generated timetables.</CardDescription>
                                </div>
                                <Link href="/department/timetables/create">
                                    <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                        <LuCalendar className="w-4 h-4 mr-2" /> Generate New
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex items-center justify-center p-12">
                                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : timetables.length === 0 ? (
                                <div className="text-center p-12 text-slate-500">
                                    <LuFileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                    <p>No timetables have been generated yet.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50">
                                            <TableHead className="w-[300px]">File Name (Time)</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Generation Time</TableHead>
                                            <TableHead>Slots Filled</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {timetables.map((tt) => (
                                            <TableRow key={tt.id} className="hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="font-medium text-slate-700">
                                                    <div className="flex items-center gap-2">
                                                        <LuFileText className="w-4 h-4 text-slate-400" />
                                                        {getFileName(tt)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {tt.isSpecial ? (
                                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                                            <LuTriangleAlert className="w-3 h-3 mr-1" /> Special Constraint
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                            Primary Master
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {tt.status === 'ACTIVE' ? (
                                                        <Badge className="bg-indigo-500 hover:bg-indigo-600">Active</Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600">Archived</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-slate-500 text-sm">
                                                    <div className="flex items-center gap-1.5">
                                                        <LuClock className="w-3.5 h-3.5" />
                                                        {formatDate(tt.createdAt)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-600 font-medium">
                                                    {tt._count?.slots || 0} slots
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/department/timetables/view/${tt.id}`}>
                                                        <Button size="sm" variant="ghost" className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50">
                                                            <LuEye className="w-4 h-4 mr-2" /> View Report
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
