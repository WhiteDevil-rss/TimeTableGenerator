import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { callAiEngine } from '../services/ai.service';
import { createClient } from 'redis';
import { socketService } from '../services/socket.service';
import { logActivity } from '../lib/logger';

const redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redisClient.connect().catch(console.error);

export const generateTimetable = async (req: AuthRequest, res: Response) => {
    try {
        const {
            departmentId,
            excludedFacultyIds = [],
            excludedRoomIds = [],
            excludedDayIds = [],
            semesterFilter = 'all',
            selectedBatchIds = [],
            continuousMode = 'balanced',
            generationType = 'NORMAL', // NORMAL | LAB_ONLY | ELECTIVE_ONLY
            lockedSlots = []           // Array of slot objects to preserve
        } = req.body;
        let { config } = req.body;

        // Normalize config for backward compatibility
        if (config && !config.numberOfBreaks && config.breakAfterLecture !== undefined) {
            config = {
                ...config,
                numberOfBreaks: config.numberOfBreaks ?? 1,
                endTime: config.endTime ?? "16:00"
            };
        }

        // Authorization Check
        if (req.user!.role === 'DEPT_ADMIN' && req.user!.entityId !== departmentId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Attempt Redis Lock (Prevent concurrent generation for same department)
        const lockKey = `lock:generate:${departmentId}`;
        let acquired: any = 'OK';

        if (redisClient.isOpen) {
            try {
                acquired = await redisClient.set(lockKey, 'LOCKED', { NX: true, EX: 60 });
            } catch (e) {
                console.error('Redis Lock Error:', e);
            }
        }

        if (!acquired) {
            return res.status(409).json({ error: 'A timetable generation is already in progress for this department.' });
        }

        try {
            // Determine Semester Filter logic
            const buildSemesterCondition = () => {
                if (semesterFilter === 'odd') return { in: [1, 3, 5, 7, 9] };
                if (semesterFilter === 'even') return { in: [2, 4, 6, 8, 10] };
                return undefined;
            };

            const semesterCondition = buildSemesterCondition();

            // Parallel Data Fetching
            const [batches, faculty, targetDept, electiveBaskets] = await Promise.all([
                prisma.batch.findMany({
                    where: {
                        departmentId,
                        ...(selectedBatchIds.length > 0 ? { id: { in: selectedBatchIds } } : (semesterCondition ? { semester: semesterCondition } : {}))
                    }
                }),
                prisma.faculty.findMany({
                    where: {
                        departments: { some: { departmentId } }
                    },
                    include: {
                        subjects: { include: { course: true } }
                    }
                }),
                prisma.department.findUnique({ where: { id: departmentId } }),
                // Fetch elective baskets for this department
                prisma.electiveBasket.findMany({
                    where: { departmentId },
                    include: {
                        options: {
                            include: {
                                course: { select: { id: true, code: true, name: true, type: true } },
                                faculty: { select: { id: true } },
                                subgroups: true,
                            },
                        },
                    },
                }),
            ]);

            if (batches.length === 0) {
                return res.status(400).json({ error: 'No batches selected or found for the current filter.' });
            }

            // Fetch courses and resources in parallel
            const programSemesterPairs = batches.map((b: any) => ({ program: b.program, semester: b.semester }));
            const [courses, resources] = await Promise.all([
                prisma.course.findMany({
                    where: {
                        departmentId,
                        AND: [
                            {
                                OR: [
                                    ...programSemesterPairs.map((p: any) => ({
                                        AND: [
                                            { OR: [{ program: p.program }, { program: null }] },
                                            { OR: [{ semester: p.semester }, { semester: null }] }
                                        ]
                                    })),
                                    { program: null, semester: null }
                                ]
                            }
                        ]
                    }
                }),
                prisma.resource.findMany({ where: { universityId: targetDept!.universityId } })
            ]);

            // Identify courses used inside any elective basket
            const electiveCourseIds = new Set<string>();
            electiveBaskets.forEach((bk: any) => {
                bk.options?.forEach((opt: any) => {
                    if (opt.course?.id) electiveCourseIds.add(opt.course.id);
                });
            });

            // Structure Payload exactly matching Pydantic Models
            const payload = {
                departmentId,
                generationType,
                config: { ...(config || {}), continuousMode },
                faculty: faculty.map((f: any) => ({
                    id: f.id,
                    name: f.name,
                    availability: f.availability || [],
                    subjects: f.subjects.map((s: any) => ({ courseId: s.courseId, isPrimary: s.isPrimary }))
                })),
                courses: courses.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    code: c.code,
                    weeklyHrs: c.weeklyHrs,
                    type: c.type,
                    isElective: c.isElective || electiveCourseIds.has(c.id),
                    program: c.program,
                    semester: c.semester
                })),
                batches: batches.map((b: any) => ({
                    id: b.id,
                    name: b.name,
                    strength: b.strength,
                    program: b.program,
                    semester: b.semester
                })),
                resources: resources.map((r: any) => ({
                    id: r.id,
                    name: r.name,
                    type: r.type,
                    capacity: r.capacity
                })),
                excludedFacultyIds,
                excludedRoomIds,
                excludedDayIds,
                lockedSlots,
                electiveBaskets: (electiveBaskets as any[]).map((bk: any) => {
                    const firstOpt = bk.options[0];
                    const derivedSemester = firstOpt?.course?.semester ?? bk.semester;
                    const derivedProgram = firstOpt?.course?.program ?? bk.program;

                    const divisionIds = batches
                        .filter((b: any) =>
                            (!derivedProgram || !b.program || derivedProgram === b.program) &&
                            (!derivedSemester || !b.semester || derivedSemester === b.semester)
                        )
                        .map((b: any) => b.id);

                    return {
                        basketId: bk.id,
                        subjectCode: bk.subjectCode,
                        name: bk.name,
                        // Always derive from master course to handle updates to subjects
                        semester: derivedSemester,
                        program: derivedProgram,
                        weeklyHrs: firstOpt?.course?.weeklyHrs ?? bk.weeklyHrs,
                        divisionIds,
                        options: bk.options.map((opt: any) => ({
                            optionId: opt.id,
                            courseId: opt.course.id,
                            enrollmentCount: opt.enrollmentCount,
                            facultyId: opt.facultyId ?? null,
                            subgroups: (opt.subgroups || []).map((sg: any) => ({
                                subgroupId: sg.id,
                                name: sg.subgroupId,
                                enrollmentCount: sg.enrollmentCount
                            }))
                        })),
                    };
                }),
            };

            const startTime = Date.now();
            const aiResponse = await callAiEngine(payload);
            const generationMs = Date.now() - startTime;

            if (aiResponse.status === 'INFEASIBLE') {
                return res.status(422).json({ error: aiResponse.message });
            }

            // Save Timetable to database
            const isSpecial = excludedFacultyIds.length > 0 || excludedRoomIds.length > 0 || generationType !== 'NORMAL';
            const savedTimetable = await prisma.$transaction(async (tx: any) => {
                const newTt = await tx.timetable.create({
                    data: {
                        universityId: targetDept!.universityId,
                        departmentId,
                        configJson: {
                            ...(config || {}),
                            continuousMode,
                            metrics: {
                                workloadVariance: aiResponse.workloadVariance,
                                utilizationScore: aiResponse.utilizationScore,
                                gapScore: aiResponse.gapScore,
                                electiveGroupCount: aiResponse.electiveGroupCount,
                            }
                        },
                        generationMs,
                        conflictCount: aiResponse.conflictCount || 0,
                        status: 'ACTIVE',
                        isSpecial
                    }
                });

                // Bulk Insert Slots
                const slotsData: any[] = [];
                aiResponse.slots.forEach((s: any) => {
                    if (s.isBreak && !s.batchId) {
                        // Create a break slot for EVERY regular batch
                        batches.forEach((b: any) => {
                            slotsData.push({
                                timetableId: newTt.id,
                                dayOfWeek: s.dayOfWeek,
                                slotNumber: s.slotNumber,
                                startTime: s.startTime,
                                endTime: s.endTime,
                                courseId: null,
                                facultyId: null,
                                roomId: null,
                                batchId: b.id,
                                isBreak: true,
                                slotType: "BREAK",
                                isElective: false,
                                basketId: null,
                                optionId: null,
                            });
                        });
                    } else {
                        slotsData.push({
                            timetableId: newTt.id,
                            dayOfWeek: s.dayOfWeek,
                            slotNumber: s.slotNumber,
                            startTime: s.startTime,
                            endTime: s.endTime,
                            courseId: s.courseId || null,
                            facultyId: s.facultyId || null,
                            roomId: s.roomId || null,
                            batchId: s.batchId,
                            isBreak: s.isBreak || false,
                            slotType: s.slotType || "THEORY",
                            // Elective Metadata
                            isElective: s.isElective || false,
                            basketId: s.basketId || null,
                            optionId: s.optionId || null,
                        });
                    }
                });

                await tx.timetableSlot.createMany({ data: slotsData });

                // Emit Real-Time WebSockets event to connected clients for this department/faculty
                socketService.broadcastTimetableGenerated(departmentId, {
                    timetableId: newTt.id,
                    isSpecial,
                    generationMs
                });

                return newTt;
            });

            // Invalidate Redis Cache for this department
            const cacheKey = `latest_timetable:${departmentId}`;
            if (redisClient.isOpen) {
                await redisClient.del(cacheKey);
            }

            res.status(200).json({ message: "Timetable Generated", timetable: savedTimetable });

            logActivity(
                req.user!.id,
                req.user!.role,
                'TIMETABLE_GENERATE',
                {
                    timetableId: savedTimetable.id,
                    departmentId,
                    isSpecial,
                    generationMs,
                    conflictCount: aiResponse.conflictCount
                }
            );

        } finally {
            if (redisClient.isOpen) {
                try {
                    await redisClient.del(lockKey); // Release lock
                } catch (e) {
                    console.error('Redis Unlock Error:', e);
                }
            }
        }

    } catch (error: any) {
        console.error("Generate Error:", error);
        res.status(500).json({ error: error.message || 'Failed to generate timetable' });
    }
};

export const getLatestTimetable = async (req: AuthRequest, res: Response) => {
    try {
        const departmentId = String(req.params.departmentId);
        const { batchId, facultyId } = req.query;

        // Check permissions
        if (req.user!.role === 'DEPT_ADMIN' && req.user!.entityId !== departmentId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        // For Faculty, they should only be able to query their own department's timetable
        if (req.user!.role === 'FACULTY') {
            const facultyRecord = await prisma.faculty.findUnique({
                where: { id: req.user!.entityId! },
                include: { departments: true }
            });
            const hasAccess = facultyRecord?.departments.some((d: any) => d.departmentId === departmentId);
            if (!hasAccess) {
                return res.status(403).json({ error: 'Forbidden' });
            }
        }

        // Try Redis Cache first
        const cacheKey = `latest_timetable:${departmentId}`;
        if (!batchId && !facultyId && redisClient.isOpen) {
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                return res.status(200).json(JSON.parse(cached));
            }
        }

        const timetable = await prisma.timetable.findFirst({
            where: {
                departmentId,
                status: 'ACTIVE'
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                slots: {
                    where: {
                        // Apply optional filters
                        ...(batchId ? { batchId: String(batchId) } : {}),
                        ...(facultyId ? { facultyId: String(facultyId) } : {})
                    },
                    include: {
                        course: { select: { id: true, code: true, type: true } },
                        faculty: { select: { id: true, name: true } },
                        room: { select: { id: true, name: true, type: true } },
                        batch: { select: { id: true, name: true } }
                    },
                    orderBy: [
                        { dayOfWeek: 'asc' },
                        { slotNumber: 'asc' }
                    ]
                }
            }
        });

        if (!timetable) {
            return res.status(200).json(null);
        }

        // Cache if no filters applied
        if (!batchId && !facultyId && redisClient.isOpen) {
            await redisClient.set(cacheKey, JSON.stringify(timetable), { EX: 3600 });
        }

        res.status(200).json(timetable);
    } catch (error: any) {
        console.error("Fetch Latest Error:", error);
        res.status(500).json({ error: 'Failed to fetch timetable' });
    }
};

export const listTimetables = async (req: AuthRequest, res: Response) => {
    try {
        const departmentId = String(req.params.departmentId);

        if (req.user!.role === 'DEPT_ADMIN' && req.user!.entityId !== departmentId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (req.user!.role === 'FACULTY') {
            const facultyRecord = await prisma.faculty.findUnique({
                where: { id: req.user!.entityId! },
                include: { departments: true }
            });
            const hasAccess = facultyRecord?.departments.some((d: any) => d.departmentId === departmentId);
            if (!hasAccess) {
                return res.status(403).json({ error: 'Forbidden' });
            }
        }

        const timetables = await prisma.timetable.findMany({
            where: { departmentId: departmentId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                status: true,
                isSpecial: true,
                createdAt: true,
                generationMs: true,
                conflictCount: true,
                _count: {
                    select: { slots: true }
                }
            }
        });

        res.json(timetables);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to list timetables' });
    }
};

export const getTimetableById = async (req: AuthRequest, res: Response) => {
    try {
        const departmentId = String(req.params.departmentId);
        const id = String(req.params.id);
        const { batchId, facultyId } = req.query;

        if (req.user!.role === 'DEPT_ADMIN' && req.user!.entityId !== departmentId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (req.user!.role === 'FACULTY') {
            const facultyRecord = await prisma.faculty.findUnique({
                where: { id: req.user!.entityId! },
                include: { departments: true }
            });
            const hasAccess = facultyRecord?.departments.some((d: any) => d.departmentId === departmentId);
            if (!hasAccess) {
                return res.status(403).json({ error: 'Forbidden' });
            }
        }

        const timetable = await prisma.timetable.findUnique({
            where: { id },
            include: {
                slots: {
                    where: {
                        ...(batchId ? { batchId: String(batchId) } : {}),
                        ...(facultyId ? { facultyId: String(facultyId) } : {})
                    },
                    include: {
                        course: { select: { id: true, code: true, type: true } },
                        faculty: { select: { id: true, name: true } },
                        room: { select: { id: true, name: true, type: true } },
                        batch: { select: { id: true, name: true } }
                    },
                    orderBy: [
                        { dayOfWeek: 'asc' },
                        { slotNumber: 'asc' }
                    ]
                }
            }
        });

        if (!timetable || timetable.departmentId !== departmentId) {
            return res.status(404).json({ error: 'Timetable not found' });
        }

        res.json(timetable);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch timetable' });
    }
};
