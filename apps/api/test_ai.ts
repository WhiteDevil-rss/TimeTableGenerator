import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import axios from 'axios';

const prisma = new PrismaClient();

async function simulate() {
    const someBatch = await prisma.batch.findFirst();
    const departmentId = someBatch?.departmentId || 'unknown';
    const config = {
        startTime: '10:30',
        endTime: '17:00',
        lectureDuration: 120,
        breakDuration: 30,
        numberOfBreaks: 1,
        daysPerWeek: 6
    };

    // Simulate what the controller does
    const [batches, faculty, courses, resources, electiveBaskets] = await Promise.all([
        prisma.batch.findMany({ where: { departmentId } }),
        prisma.faculty.findMany({
            where: { departments: { some: { departmentId } } },
            include: { subjects: true }
        }),
        prisma.course.findMany({ where: { departmentId } }),
        prisma.resource.findMany(),
        prisma.electiveBasket.findMany({
            where: { departmentId },
            include: { options: { include: { course: true, faculty: true, subgroups: true } } }
        })
    ]);

    const electiveCourseIds = new Set<string>();
    electiveBaskets.forEach((bk: any) => bk.options.forEach((opt: any) => {
        if (opt.courseId) electiveCourseIds.add(opt.courseId);
    }));

    const payload = {
        departmentId,
        config: config,
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
            semester: c.semester,
            labDuration: c.labDuration || 1
        })),
        batches: batches.map((b: any) => ({
            id: b.id, name: b.name, strength: b.strength, program: b.program, semester: b.semester
        })),
        resources: resources.map((r: any) => ({
            id: r.id, name: r.name, type: r.type, capacity: r.capacity
        })),
        electiveBaskets: electiveBaskets.map((bk: any) => ({
            basketId: bk.id, subjectCode: bk.subjectCode || 'ELEC', name: bk.name, weeklyHrs: bk.weeklyHrs,
            program: bk.program, semester: bk.semester, divisionIds: batches.map((b: any) => b.id),
            options: bk.options.map((opt: any) => ({
                optionId: opt.id, courseId: opt.courseId, enrollmentCount: opt.enrollmentCount,
                facultyId: opt.facultyId, subgroups: opt.subgroups || []
            }))
        }))
    };

    fs.writeFileSync('payload.json', JSON.stringify(payload, null, 2));
    console.log("Wrote payload to payload.json");
}

simulate().then(() => prisma.$disconnect()).catch(console.error);
