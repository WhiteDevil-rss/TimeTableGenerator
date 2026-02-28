'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { WorkloadBadge } from './workload-badge';
import { LuUsers } from 'react-icons/lu';

interface WorkloadSummaryProps {
    slots: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const WorkloadSummary: React.FC<WorkloadSummaryProps> = ({ slots }) => {

    const stats = useMemo(() => {
        // Map: facultyId -> { faculty, assignedHours }
        const facultyMap = new Map<string, { faculty: any, assignedHours: number }>(); // eslint-disable-line @typescript-eslint/no-explicit-any

        slots.forEach((s: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            // Ignore breaks
            if (!s.isBreak && s.facultyId && s.faculty) {
                if (!facultyMap.has(s.facultyId)) {
                    facultyMap.set(s.facultyId, { faculty: s.faculty, assignedHours: 0 });
                }

                // Add assigned hours (Assuming MVP slots = 1 hr each)
                // If slots are dynamic, we would calculate diff between start and end.
                facultyMap.get(s.facultyId)!.assignedHours += 1;
            }
        });

        return Array.from(facultyMap.values()).sort((a, b) => b.assignedHours - a.assignedHours);
    }, [slots]);

    if (stats.length === 0) return null;

    return (
        <Card className="mt-6 shadow-sm border-slate-200 print:hidden">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <LuUsers className="w-5 h-5 text-indigo-500" />
                    Faculty Workload Summary
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-medium">
                            <tr>
                                <th className="px-4 py-3 border-b">Faculty Name</th>
                                <th className="px-4 py-3 border-b">Designation</th>
                                <th className="px-4 py-3 border-b">Total Workload</th>
                                <th className="px-4 py-3 border-b">Weekly Limit</th>
                                <th className="px-4 py-3 border-b text-right">Status Indicator</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {stats.map((stat: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                                <tr key={stat.faculty.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-800">{stat.faculty.name}</td>
                                    <td className="px-4 py-3 text-slate-500">{stat.faculty.designation || 'Faculty'}</td>
                                    <td className="px-4 py-3 font-semibold text-slate-700">{stat.assignedHours} hrs</td>
                                    <td className="px-4 py-3 text-slate-500">{stat.faculty.maxHrsPerWeek} hrs</td>
                                    <td className="px-4 py-3 text-right">
                                        <WorkloadBadge
                                            assignedHours={stat.assignedHours}
                                            maxHours={stat.faculty.maxHrsPerWeek}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};
