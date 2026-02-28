'use client';

import React, { useMemo, useState } from 'react';
import { TimetableCell } from './timetable-cell';
import { Card } from '@/components/ui/card';
import { LuUsers } from 'react-icons/lu';

interface TimetableGridProps {
    slots: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    config: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    viewMode: 'admin' | 'faculty';
    facultyId?: string;
    baselineSlots?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({ slots, config, viewMode, facultyId, baselineSlots }) => {
    const [selectedBatch, setSelectedBatch] = useState<string>('ALL');

    // Extract unique batches for the filter
    const uniqueBatches = useMemo(() => {
        const batchMap = new Map<string, any>(); // eslint-disable-line @typescript-eslint/no-explicit-any
        slots.forEach(s => {
            if (!s.isBreak && s.batch) {
                batchMap.set(s.batchId, s.batch);
            }
        });
        return Array.from(batchMap.values());
    }, [slots]);

    // Determine grid bounds based on config
    const days = config?.daysPerWeek || 5;
    const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].slice(0, days);

    // Calculate max slots per day (including breaks)
    const maxSlots = useMemo(() => {
        let max = 0;
        slots.forEach(s => {
            if (s.slotNumber > max) max = s.slotNumber;
        });
        return max > 0 ? max : 7; // default 7
    }, [slots]);

    // Create a 2D mapping mapping: dayOfWeek (1-indexed) -> slotNumber -> array of slots at that time
    const gridMap = useMemo(() => {
        const map = new Map<number, Map<number, any[]>>(); // eslint-disable-line @typescript-eslint/no-explicit-any

        // Initialize empty maps
        for (let d = 1; d <= days; d++) {
            map.set(d, new Map<number, any[]>()); // eslint-disable-line @typescript-eslint/no-explicit-any
            for (let p = 1; p <= maxSlots; p++) {
                map.get(d)!.set(p, []);
            }
        }

        // Populate maps
        slots.forEach(s => {
            // Apply filters early
            if (s.isBreak) {
                // Breaks go everywhere in standard mode
                if (map.has(s.dayOfWeek) && map.get(s.dayOfWeek)!.has(s.slotNumber)) {
                    map.get(s.dayOfWeek)!.get(s.slotNumber)!.push(s);
                }
            } else {
                const matchesBatch = selectedBatch === 'ALL' || s.batchId === selectedBatch;
                const matchesFaculty = viewMode === 'admin' || (viewMode === 'faculty' && s.facultyId === facultyId);

                if (matchesBatch && matchesFaculty) {
                    if (map.has(s.dayOfWeek) && map.get(s.dayOfWeek)!.has(s.slotNumber)) {
                        map.get(s.dayOfWeek)!.get(s.slotNumber)!.push(s);
                    }
                }
            }
        });

        return map;
    }, [slots, days, maxSlots, selectedBatch, viewMode, facultyId]);

    return (
        <div className="flex flex-col space-y-4">

            {/* Filters Bar */}
            {viewMode === 'admin' && uniqueBatches.length > 0 && (
                <div className="flex items-center gap-4 p-4 bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl shadow-sm sticky top-0 z-30 mb-2">
                    <div className="flex items-center gap-2">
                        <LuUsers className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-semibold text-slate-700">Display Batch:</span>
                    </div>
                    <select
                        value={selectedBatch}
                        onChange={e => setSelectedBatch(e.target.value)}
                        className="text-sm border-slate-200 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer bg-white"
                    >
                        <option value="ALL">All Batches (Combined View)</option>
                        {uniqueBatches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Grid Container */}
            <Card className="overflow-hidden border-slate-200 shadow-xl rounded-xl">
                <div className="overflow-auto max-h-[75vh] custom-scrollbar">
                    <div className="min-w-[1000px]">
                        {/* Sticky Day Headers */}
                        <div className="grid sticky top-0 z-20 font-bold text-slate-600 bg-white border-b shadow-sm" style={{ gridTemplateColumns: `120px repeat(${days}, minmax(0, 1fr))` }}>
                            <div className="p-4 border-r bg-slate-50/50 flex items-center justify-center text-[10px] uppercase tracking-widest text-slate-400 font-black">
                                Period
                            </div>
                            {dayLabels.map((day, i) => (
                                <div key={day} className={`p-4 text-center text-sm ${i < days - 1 ? 'border-r' : ''}`}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="divide-y divide-slate-100 bg-slate-50/30">
                            {Array.from({ length: maxSlots }).map((_, pIdx) => {
                                const p = pIdx + 1;
                                let startTime = "";
                                let endTime = "";

                                for (let d = 1; d <= days; d++) {
                                    const sl = gridMap.get(d)?.get(p)?.[0];
                                    if (sl) {
                                        startTime = sl.startTime;
                                        endTime = sl.endTime;
                                        break;
                                    }
                                }

                                return (
                                    <div key={p} className="grid group" style={{ gridTemplateColumns: `120px repeat(${days}, minmax(0, 1fr))` }}>
                                        {/* Sticky Time Column */}
                                        <div className="p-3 border-r bg-white sticky left-0 z-10 flex flex-col items-center justify-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] group-hover:bg-slate-50 transition-colors">
                                            <span className="text-[11px] font-bold text-slate-700 tracking-tight">{startTime}</span>
                                            <div className="h-3 w-[1px] bg-slate-200 my-0.5" />
                                            <span className="text-[11px] font-bold text-slate-400 tracking-tight">{endTime}</span>
                                        </div>

                                        {/* Day Columns */}
                                        {Array.from({ length: days }).map((_, dIdx) => {
                                            const d = dIdx + 1;
                                            const cellSlots = gridMap.get(d)!.get(p) || [];

                                            return (
                                                <div key={d} className={`p-1.5 min-h-[120px] ${dIdx < days - 1 ? 'border-r border-slate-100' : ''} group-hover:bg-indigo-50/10 transition-colors`}>
                                                    {cellSlots.length > 0 ? (
                                                        <div className="flex flex-col gap-2 h-full">
                                                            {cellSlots.map((slot, sIdx) => {
                                                                // Difference Detection Logic
                                                                let diffStatus: 'new' | 'changed' | 'unchanged' = 'unchanged';
                                                                if (baselineSlots && !slot.isBreak) {
                                                                    const baseline = baselineSlots.find(b =>
                                                                        b.dayOfWeek === slot.dayOfWeek &&
                                                                        b.slotNumber === slot.slotNumber &&
                                                                        b.batchId === slot.batchId
                                                                    );

                                                                    if (!baseline) {
                                                                        diffStatus = 'new';
                                                                    } else if (
                                                                        baseline.facultyId !== slot.facultyId ||
                                                                        baseline.roomId !== slot.roomId
                                                                    ) {
                                                                        diffStatus = 'changed';
                                                                    }
                                                                }

                                                                return (
                                                                    <TimetableCell
                                                                        key={`${slot.slotNumber}-${sIdx}`}
                                                                        slot={slot}
                                                                        viewMode={viewMode}
                                                                        diffStatus={diffStatus}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="h-full w-full rounded-md border border-dashed border-slate-200/50 flex items-center justify-center">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200/50" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </Card>

        </div>
    );
};
