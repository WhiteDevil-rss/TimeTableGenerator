import React from 'react';
import { cn } from '@/lib/utils';
import { LuClock } from 'react-icons/lu';

interface WorkloadBadgeProps {
    assignedHours: number;
    maxHours: number;
    className?: string;
}

export const WorkloadBadge: React.FC<WorkloadBadgeProps> = ({ assignedHours, maxHours, className }) => {
    const percentage = maxHours > 0 ? (assignedHours / maxHours) * 100 : 0;

    let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
    let iconColor = 'text-slate-400';

    if (percentage > 90) {
        colorClass = 'bg-red-50 text-red-700 border-red-200';
        iconColor = 'text-red-500';
    } else if (percentage >= 70) {
        colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
        iconColor = 'text-amber-500';
    } else if (percentage > 0) {
        colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        iconColor = 'text-emerald-500';
    }

    return (
        <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold tracking-wide", colorClass, className)}>
            <LuClock className={cn("w-3.5 h-3.5", iconColor)} />
            <span>{assignedHours} / {maxHours} hrs</span>
        </div>
    );
};
