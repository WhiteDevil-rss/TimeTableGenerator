import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// ------------------------------------------------------------------
// GET /departments/:deptId/electives
// ------------------------------------------------------------------
export async function listElectiveBaskets(req: Request, res: Response) {
    const deptId = String(req.params.departmentId);
    try {
        const baskets = await prisma.electiveBasket.findMany({
            where: { departmentId: deptId },
            include: {
                options: {
                    include: {
                        course: { select: { id: true, code: true, name: true, type: true } },
                        faculty: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.json(baskets);
    } catch (err) {
        console.error('[ElectiveController] listElectiveBaskets', err);
        return res.status(500).json({ error: 'Failed to fetch elective baskets.' });
    }
}

// ------------------------------------------------------------------
// POST /departments/:deptId/electives
// Body: { subjectCode, name, semester?, program?, weeklyHrs, options: [{courseId, enrollmentCount, facultyId?}] }
// ------------------------------------------------------------------
export async function createElectiveBasket(req: Request, res: Response) {
    const deptId = String(req.params.departmentId);
    const { subjectCode, name, options = [] } = req.body;

    if (!subjectCode || !name) {
        return res.status(400).json({ error: 'subjectCode and name are required.' });
    }
    if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ error: 'An elective basket must have at least 2 options.' });
    }

    try {
        // 1. Fetch and validate all courses in one go
        const courseIds = options.map((o: any) => o.courseId);
        const uniqueCourseIds = [...new Set(courseIds)];
        if (uniqueCourseIds.length !== courseIds.length) {
            return res.status(400).json({ error: 'Duplicate subjects selected in the same basket.' });
        }

        const masterCourses = await prisma.course.findMany({
            where: {
                id: { in: courseIds }
            }
        });

        // Ensure all found courses belong either to this department or are university-wide (null dept)
        const invalidDeptCourse = masterCourses.find(c => c.departmentId && c.departmentId !== deptId);
        if (invalidDeptCourse) {
            return res.status(400).json({ error: `Subject ${invalidDeptCourse.code} belongs to a different department.` });
        }

        if (masterCourses.length !== uniqueCourseIds.length) {
            return res.status(400).json({ error: 'One or more selected subjects could not be found.' });
        }

        // 2. Validate consistency (e.g., all should have the same weeklyHrs)
        const firstCourse = masterCourses[0];
        const allSameHrs = masterCourses.every(c => c.weeklyHrs === firstCourse.weeklyHrs);
        if (!allSameHrs) {
            return res.status(400).json({ error: 'All elective options in a basket must have the same weekly hours.' });
        }

        // 2b. Calculate global max room capacity for this university for splitting logic
        const departmentInfo = await prisma.department.findUnique({ where: { id: deptId } });
        const maxRoom = await prisma.resource.findFirst({
            where: { universityId: departmentInfo?.universityId },
            orderBy: { capacity: 'desc' }
        });
        const maxCapacity = maxRoom?.capacity || 60; // Fallback

        const buildSubgroups = (enrollment: number, maxCap: number) => {
            const numGroups = Math.ceil(enrollment / maxCap) || 1;
            const subgroups = [];
            const baseSize = Math.floor(enrollment / numGroups);
            let remainder = enrollment % numGroups;
            for (let i = 0; i < numGroups; i++) {
                subgroups.push({
                    subgroupId: `Group ${i + 1}`,
                    enrollmentCount: baseSize + (remainder > 0 ? 1 : 0)
                });
                remainder--;
            }
            return subgroups;
        };

        // 3. Create Basket - auto-derive sem/prog/hrs from master data
        const basket = await prisma.electiveBasket.create({
            data: {
                departmentId: deptId,
                subjectCode,
                name,
                semester: firstCourse.semester,
                program: firstCourse.program,
                weeklyHrs: firstCourse.weeklyHrs,
                options: {
                    create: options.map((opt: {
                        courseId: string;
                        enrollmentCount?: number;
                        facultyId?: string;
                    }) => ({
                        courseId: opt.courseId,
                        enrollmentCount: opt.enrollmentCount ?? 30,
                        facultyId: opt.facultyId ?? null,
                        subgroups: {
                            create: buildSubgroups(opt.enrollmentCount ?? 30, maxCapacity)
                        }
                    })),
                },
            },
            include: {
                options: {
                    include: {
                        course: { select: { id: true, code: true, name: true } },
                        faculty: { select: { id: true, name: true } },
                    },
                },
            },
        });
        return res.status(201).json(basket);
    } catch (err) {
        console.error('[ElectiveController] createElectiveBasket', err);
        return res.status(500).json({ error: 'Failed to create elective basket.' });
    }
}

// ------------------------------------------------------------------
// PUT /departments/:deptId/electives/:id
// ------------------------------------------------------------------
export async function updateElectiveBasket(req: Request, res: Response) {
    const deptId = String(req.params.departmentId);
    const id = String(req.params.id);
    const { subjectCode, name, options } = req.body;

    try {
        const existing = await prisma.electiveBasket.findFirst({
            where: { id: id, departmentId: deptId },
        });
        if (!existing) return res.status(404).json({ error: 'Elective basket not found.' });

        let updateData: any = {
            subjectCode: subjectCode ?? existing.subjectCode,
            name: name ?? existing.name,
        };

        if (options && Array.isArray(options)) {
            const courseIds = options.map((o: any) => o.courseId);
            const uniqueCourseIds = [...new Set(courseIds)];

            if (uniqueCourseIds.length !== courseIds.length) {
                return res.status(400).json({ error: 'Duplicate subjects selected in the same basket.' });
            }

            const masterCourses = await prisma.course.findMany({
                where: { id: { in: uniqueCourseIds } }
            });

            // Ensure all found courses belong either to this department or are university-wide (null dept)
            const invalidDeptCourse = masterCourses.find(c => c.departmentId && c.departmentId !== deptId);
            if (invalidDeptCourse) {
                return res.status(400).json({ error: `Subject ${invalidDeptCourse.code} belongs to a different department.` });
            }

            if (masterCourses.length !== uniqueCourseIds.length) {
                return res.status(400).json({ error: 'One or more selected subjects are invalid.' });
            }

            const firstCourse = masterCourses[0];
            const allSameHrs = masterCourses.every(c => c.weeklyHrs === firstCourse.weeklyHrs);
            if (!allSameHrs) {
                return res.status(400).json({ error: 'All elective options must have matching weekly hours.' });
            }

            // Clean old options and set new derived data
            await prisma.electiveOption.deleteMany({ where: { basketId: id } });

            const departmentInfo = await prisma.department.findUnique({ where: { id: deptId } });
            const maxRoom = await prisma.resource.findFirst({
                where: { universityId: departmentInfo?.universityId },
                orderBy: { capacity: 'desc' }
            });
            const maxCapacity = maxRoom?.capacity || 60; // Fallback

            const buildSubgroups = (enrollment: number, maxCap: number) => {
                const numGroups = Math.ceil(enrollment / maxCap) || 1;
                const subgroups = [];
                const baseSize = Math.floor(enrollment / numGroups);
                let remainder = enrollment % numGroups;
                for (let i = 0; i < numGroups; i++) {
                    subgroups.push({
                        subgroupId: `Group ${i + 1}`,
                        enrollmentCount: baseSize + (remainder > 0 ? 1 : 0)
                    });
                    remainder--;
                }
                return subgroups;
            };

            updateData = {
                ...updateData,
                semester: firstCourse.semester,
                program: firstCourse.program,
                weeklyHrs: firstCourse.weeklyHrs,
                options: {
                    create: options.map((opt: {
                        courseId: string;
                        enrollmentCount?: number;
                        facultyId?: string;
                    }) => ({
                        courseId: opt.courseId,
                        enrollmentCount: opt.enrollmentCount ?? 30,
                        facultyId: opt.facultyId ?? null,
                        subgroups: {
                            create: buildSubgroups(opt.enrollmentCount ?? 30, maxCapacity)
                        }
                    })),
                }
            };
        }

        const updated = await prisma.electiveBasket.update({
            where: { id },
            data: updateData,
            include: {
                options: {
                    include: {
                        course: { select: { id: true, code: true, name: true } },
                        faculty: { select: { id: true, name: true } },
                    },
                },
            },
        });
        return res.json(updated);
    } catch (err) {
        console.error('[ElectiveController] updateElectiveBasket', err);
        return res.status(500).json({ error: 'Failed to update elective basket.' });
    }
}

// ------------------------------------------------------------------
// DELETE /departments/:deptId/electives/:id
// ------------------------------------------------------------------
export async function deleteElectiveBasket(req: Request, res: Response) {
    const deptId = String(req.params.departmentId);
    const id = String(req.params.id);
    try {
        const existing = await prisma.electiveBasket.findFirst({
            where: { id: id, departmentId: deptId },
        });
        if (!existing) return res.status(404).json({ error: 'Elective basket not found.' });

        await prisma.electiveBasket.delete({ where: { id } });
        return res.json({ message: 'Elective basket deleted.' });
    } catch (err) {
        console.error('[ElectiveController] deleteElectiveBasket', err);
        return res.status(500).json({ error: 'Failed to delete elective basket.' });
    }
}
