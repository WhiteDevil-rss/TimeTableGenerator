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
                    <div className="glass-card shadow-sm border-slate-200 dark:border-white/5 rounded-[2rem] overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon-cyan/15 dark:bg-neon-cyan/5 blur-[100px] rounded-full pointer-events-none" />

                        <div className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 p-6 relative z-10">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight glow-cyan">Timetable Archive</h2>
                                    <p className="text-slate-600 dark:text-slate-400 font-light mt-1">View and access all previously generated timetables.</p>
                                </div>
                                <Link href="/department/timetables/create">
                                    <Button className="bg-neon-cyan text-white dark:text-[#0a0a0c] font-bold hover:bg-cyan-600 dark:hover:bg-white transition-all shadow-[0_0_15px_rgba(57,193,239,0.4)] hover:shadow-[0_0_25px_rgba(57,193,239,0.6)]">
                                        <LuCalendar className="w-5 h-5 mr-2" /> Generate New
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="p-0 relative z-10">
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
                                        <TableRow className="bg-slate-50 dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-200 dark:border-white/10">
                                            <TableHead className="w-[300px] text-slate-600 dark:text-slate-400 font-medium">File Name (Time)</TableHead>
                                            <TableHead className="text-slate-600 dark:text-slate-400 font-medium">Type</TableHead>
                                            <TableHead className="text-slate-600 dark:text-slate-400 font-medium">Status</TableHead>
                                            <TableHead className="text-slate-600 dark:text-slate-400 font-medium">Generation Time</TableHead>
                                            <TableHead className="text-slate-600 dark:text-slate-400 font-medium">Slots Filled</TableHead>
                                            <TableHead className="text-right text-slate-600 dark:text-slate-400 font-medium">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {timetables.map((tt) => (
                                            <TableRow key={tt.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-200 dark:border-white/5 group">
                                                <TableCell className="font-medium text-slate-900 dark:text-white">
                                                    <div className="flex items-center gap-2">
                                                        <LuFileText className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-neon-cyan transition-colors" />
                                                        {getFileName(tt)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {tt.isSpecial ? (
                                                        <Badge variant="outline" className="bg-neon-purple/10 text-neon-purple border-neon-purple/30 shadow-[0_0_10px_rgba(184,84,245,0.1)]">
                                                            <LuTriangleAlert className="w-3 h-3 mr-1" /> Special Constraint
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30 shadow-[0_0_10px_rgba(57,193,239,0.1)]">
                                                            Primary Master
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {tt.status === 'ACTIVE' ? (
                                                        <Badge className="bg-neon-cyan text-white dark:text-[#0a0a0c] font-bold shadow-[0_0_10px_rgba(57,193,239,0.4)] hover:bg-cyan-600 dark:hover:bg-white">Active</Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700">Archived</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-slate-600 dark:text-slate-400 text-sm font-light">
                                                    <div className="flex items-center gap-1.5">
                                                        <LuClock className="w-3.5 h-3.5" />
                                                        {formatDate(tt.createdAt)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-900 dark:text-white font-medium">
                                                    {tt._count?.slots || 0} slots
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/department/timetables/view/${tt.id}`}>
                                                        <Button size="sm" variant="ghost" className="text-cyan-600 dark:text-neon-cyan hover:text-slate-900 dark:hover:text-white hover:bg-cyan-50 dark:hover:bg-white/10 rounded-lg group/btn shadow-[0_0_15px_rgba(57,193,239,0)] hover:shadow-[0_0_15px_rgba(57,193,239,0.3)] transition-all border border-transparent dark:hover:border-neon-cyan/30">
                                                            <LuEye className="w-4 h-4 mr-2" /> View Report
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
