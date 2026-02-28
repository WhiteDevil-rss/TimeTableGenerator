'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LuPlusCircle, LuTriangleAlert, LuEye, LuArrowRight } from 'react-icons/lu';
import Link from 'next/link';
import { DEPT_ADMIN_NAV } from '@/lib/constants/nav-config';

export default function TimetablesMenuPage() {
    const options = [
        {
            title: "Regular timetable",
            description: "Configure global parameters and trigger the AI scheduler to generate a primary timetable for the department.",
            icon: <LuPlusCircle className="w-8 h-8 text-indigo-500" />,
            href: "/department/timetables/create",
            color: "border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50",
            iconBg: "bg-indigo-100"
        },
        {
            title: "Special timetable",
            description: "Select unavailable faculty members or rooms to reconstruct an active timetable using remaining resources.",
            icon: <LuTriangleAlert className="w-8 h-8 text-amber-500" />,
            href: "/department/special",
            color: "border-amber-200 bg-amber-50/30 hover:bg-amber-50",
            iconBg: "bg-amber-100"
        },
        {
            title: "View time table",
            description: "View the most recently generated active timetable and workload summary.",
            icon: <LuEye className="w-8 h-8 text-emerald-500" />,
            href: "/department/timetables/view",
            color: "border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50",
            iconBg: "bg-emerald-100"
        }
    ];

    return (
        <ProtectedRoute allowedRoles={['DEPT_ADMIN']}>
            <DashboardLayout navItems={DEPT_ADMIN_NAV} title="Timetables Menu">
                <div className="max-w-5xl mx-auto space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Manage Timetables</h2>
                        <p className="text-slate-500">Select an action to generate, supervise, or view schedules.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {options.map((option, idx) => (
                            <Link href={option.href} key={idx} className="block group">
                                <Card className={`h-full transition-all duration-300 border-2 ${option.color} cursor-pointer shadow-sm hover:shadow-md`}>
                                    <CardHeader>
                                        <div className={`w-14 h-14 rounded-2xl ${option.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                            {option.icon}
                                        </div>
                                        <CardTitle className="text-xl group-hover:text-indigo-700 transition-colors">
                                            {option.title}
                                        </CardTitle>
                                        <CardDescription className="text-sm mt-2 font-medium">
                                            {option.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center text-sm font-bold text-slate-500 group-hover:text-indigo-600">
                                            Go to action <LuArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
