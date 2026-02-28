import React from 'react';
import { cn } from '@/lib/utils';
import { LuUser, LuBuilding, LuUsers } from 'react-icons/lu';

interface TimetableCellProps {
    slot: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    viewMode: 'admin' | 'faculty';
    className?: string;
    diffStatus?: 'new' | 'changed' | 'unchanged';
}

export const TimetableCell: React.FC<TimetableCellProps> = ({ slot, viewMode, className, diffStatus }) => {
    if (!slot) {
        return (
            <div className={cn("h-full w-full min-h-[100px] border border-slate-100 bg-white/50 backdrop-blur-sm transition-colors hover:bg-slate-50", className)}>
                {/* Empty slot */}
            </div>
        );
    }

    if (slot.isBreak) {
        return (
            <div className={cn("h-full w-full min-h-[100px] border border-amber-200 bg-amber-50 flex flex-col items-center justify-center p-2", className)}>
                <span className="font-semibold text-amber-700 uppercase tracking-widest text-sm">Break</span>
            </div>
        );
    }

    // Type based colors
    const isLab = slot.slotType.includes('LAB');

    const bgClass = isLab ? 'bg-purple-50 hover:bg-purple-100 border-purple-200' : 'bg-blue-50 hover:bg-blue-100 border-blue-200';
    const headerTextClass = isLab ? 'text-purple-800' : 'text-blue-800';
    const bodyTextClass = isLab ? 'text-purple-600' : 'text-blue-600';
    const iconClass = isLab ? 'text-purple-400' : 'text-blue-400';

    return (
        <div className={cn(
            `h-full w-full min-h-[110px] border rounded-lg p-2.5 transition-all flex flex-col justify-between shadow-sm relative overflow-hidden`,
            bgClass,
            diffStatus === 'changed' && "ring-2 ring-amber-400 ring-offset-2 scale-[1.02] shadow-amber-100 z-10",
            diffStatus === 'new' && "ring-2 ring-emerald-400 ring-offset-2 scale-[1.02] shadow-emerald-100 z-10",
            className
        )}>
            {diffStatus && diffStatus !== 'unchanged' && (
                <div className={cn(
                    "absolute top-0 right-0 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white rounded-bl-lg animate-pulse",
                    diffStatus === 'changed' ? "bg-amber-500" : "bg-emerald-500"
                )}>
                    {diffStatus}
                </div>
            )}
            <div className="flex flex-col gap-1.5 mb-2">
                <div className="flex justify-between items-start gap-1">
                    <div className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold border uppercase tracking-tighter ${isLab ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-blue-100 border-blue-200 text-blue-700'}`}>
                        {slot.slotType}
                    </div>
                    {slot.course?.code && (
                        <span className={`text-[10px] font-mono font-bold ${iconClass}`}>
                            {slot.course.code}
                        </span>
                    )}
                </div>
                <div className={`font-bold text-xs leading-[1.3] line-clamp-3 ${headerTextClass}`}>
                    {slot.course?.name}
                </div>
            </div>

            <div className={`text-[11px] space-y-1 mt-auto pt-2 border-t border-dashed ${isLab ? 'border-purple-200' : 'border-blue-200'} ${bodyTextClass}`}>
                {viewMode === 'admin' ? (
                    <>
                        <div className="flex items-center gap-1.5 font-medium">
                            <LuUser className={`w-3 h-3 ${iconClass}`} />
                            <span className="truncate">{slot.faculty?.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-80">
                            <LuBuilding className={`w-3 h-3 ${iconClass}`} />
                            <span className="truncate">{slot.room?.name}</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-1.5 font-medium">
                            <LuUsers className={`w-3 h-3 ${iconClass}`} />
                            <span className="truncate">{slot.batch?.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-80">
                            <LuBuilding className={`w-3 h-3 ${iconClass}`} />
                            <span className="truncate">{slot.room?.name}</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
