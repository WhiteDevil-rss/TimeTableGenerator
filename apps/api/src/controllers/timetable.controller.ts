import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { callAiEngine } from '../services/ai.service';
import { createClient } from 'redis';
import { socketService } from '../services/socket.service';
import { logActivity } from '../utils/activity-logger';

const redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redisClient.connect().catch(console.error);

export const generateTimetable = async (req: AuthRequest, res: Response) => {
    try {
        let { departmentId, config, excludedFacultyIds = [], excludedRoomIds = [], excludedDayIds = [], semesterFilter = 'all' } = req.body;

        // Normalize config for backward compatibility
        if (config && !config.numberOfBreaks && config.breakAfterLecture !== undefined) {
            // If old schema is detected, map it to the new one
            // This is a best-effort conversion to satisfy Pydantic
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
        const acquired = await redisClient.set(lockKey, 'LOCKED', { NX: true, EX: 60 });

        if (!acquired) {
            return res.status(409).json({ error: 'A timetable generation is already in progress for this department.' });
        }

        try {
            // Determine Semester Filter logic
            const buildSemesterCondition = () => {
                if (semesterFilter === 'odd') {
                    return { in: [1, 3, 5, 7, 9] };
                } else if (semesterFilter === 'even') {
                    return { in: [2, 4, 6, 8, 10] };
                }
                return undefined;
            };

            const semesterCondition = buildSemesterCondition();

            // Fetch all relational data
            const faculty = await prisma.faculty.findMany({
                where: { departmentId },
                include: { subjects: { include: { course: true } } }
            });

            const courses = await prisma.course.findMany({
                where: {
                    departmentId,
                    ...(semesterCondition ? { semester: semesterCondition } : {})
                }
            });
            const batches = await prisma.batch.findMany({
                where: {
                    departmentId,
                    ...(semesterCondition ? { semester: semesterCondition } : {})
                }
            });

            // Fetch resources (Classrooms / Labs) allocated to the university pool
            const targetDept = await prisma.department.findUnique({ where: { id: departmentId } });
            const resources = await prisma.resource.findMany({ where: { universityId: targetDept!.universityId } });

            // Structure Payload exactly matching Pydantic Models 
            const payload = {
                departmentId,
                config,
                faculty: faculty.map(f => ({
                    id: f.id,
                    name: f.name,
                    maxHrsPerDay: f.maxHrsPerDay,
                    maxHrsPerWeek: f.maxHrsPerWeek,
                    subjects: f.subjects.map(s => ({ courseId: s.courseId, isPrimary: s.isPrimary }))
                })),
                courses: courses.map(c => ({
                    id: c.id,
                    code: c.code,
                    weeklyHrs: c.weeklyHrs,
                    type: c.type,
                    program: c.program
                })),
                batches: batches.map(b => ({
                    id: b.id,
                    name: b.name,
                    strength: b.strength,
                    program: b.program,
                    semester: b.semester
                })),
                resources: resources.map(r => ({
                    id: r.id,
                    name: r.name,
                    type: r.type,
                    capacity: r.capacity
                })),
                excludedFacultyIds,
                excludedRoomIds
            };

            const startTime = Date.now();
            const aiResponse = await callAiEngine(payload);
            const generationMs = Date.now() - startTime;

            if (aiResponse.status === 'INFEASIBLE') {
                return res.status(422).json({ error: aiResponse.message });
            }

            // Save Timetable to database
            const isSpecial = excludedFacultyIds.length > 0 || excludedRoomIds.length > 0;
            const savedTimetable = await prisma.$transaction(async (tx: any) => {
                const newTt = await tx.timetable.create({
                    data: {
                        universityId: targetDept!.universityId,
                        departmentId,
                        configJson: config,
                        generationMs,
                        conflictCount: aiResponse.conflictCount,
                        status: 'ACTIVE',
                        isSpecial
                    }
                });

                // Bulk Insert Slots
                const slotsData = aiResponse.slots.map((s: any) => ({
                    timetableId: newTt.id,
                    dayOfWeek: s.dayOfWeek,
                    slotNumber: s.slotNumber,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    courseId: s.courseId,
                    facultyId: s.facultyId,
                    roomId: s.roomId,
                    batchId: s.batchId,
                    isBreak: s.isBreak,
                    slotType: s.slotType
                }));

                await tx.timetableSlot.createMany({ data: slotsData });

                // Emit Real-Time WebSockets event to connected clients for this department/faculty
                socketService.broadcastTimetableGenerated(departmentId, {
                    timetableId: newTt.id,
                    isSpecial,
                    generationMs
                });

                return newTt;
            });

            const fullTimetable = await prisma.timetable.findUnique({
                where: { id: savedTimetable.id },
                include: {
                    slots: {
                        include: {
                            course: true,
                            faculty: true,
                            room: true,
                            batch: true
                        }
                    }
                }
            });

            res.status(200).json({ message: "Timetable Generated", timetable: fullTimetable });

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
            await redisClient.del(lockKey); // Release lock
        }

    } catch (error: any) {
        console.error("Generate Error:", error);
        res.status(500).json({ error: error.message || 'Failed to generate timetable' });
    }
};

export const getLatestTimetable = async (req: AuthRequest, res: Response) => {
    try {
        const { departmentId } = req.params;
        const { batchId, facultyId } = req.query;

        // Check permissions
        if (req.user!.role === 'DEPT_ADMIN' && req.user!.entityId !== departmentId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        // For Faculty, they should only be able to query their own department's timetable
        if (req.user!.role === 'FACULTY') {
            const facultyRecord = await prisma.faculty.findUnique({ where: { id: req.user!.entityId! } });
            if (facultyRecord?.departmentId !== departmentId) {
                return res.status(403).json({ error: 'Forbidden' });
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
                        course: true,
                        faculty: true,
                        room: true,
                        batch: true
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

        res.status(200).json(timetable);
    } catch (error: any) {
        console.error("Fetch Latest Error:", error);
        res.status(500).json({ error: 'Failed to fetch timetable' });
    }
};

export const listTimetables = async (req: AuthRequest, res: Response) => {
    try {
        const { departmentId } = req.params;

        if (req.user!.role === 'DEPT_ADMIN' && req.user!.entityId !== departmentId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (req.user!.role === 'FACULTY') {
            const facultyRecord = await prisma.faculty.findUnique({ where: { id: req.user!.entityId! } });
            if (facultyRecord?.departmentId !== departmentId) {
                return res.status(403).json({ error: 'Forbidden' });
            }
        }

        const timetables = await prisma.timetable.findMany({
            where: { departmentId },
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
        const { departmentId, id } = req.params;
        const { batchId, facultyId } = req.query;

        if (req.user!.role === 'DEPT_ADMIN' && req.user!.entityId !== departmentId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (req.user!.role === 'FACULTY') {
            const facultyRecord = await prisma.faculty.findUnique({ where: { id: req.user!.entityId! } });
            if (facultyRecord?.departmentId !== departmentId) {
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
                        course: true,
                        faculty: true,
                        room: true,
                        batch: true
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
