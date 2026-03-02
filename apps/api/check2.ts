import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    const courses = await prisma.course.findMany({
        select: { id: true, code: true, name: true, isElective: true }
    });
    const cMap = new Map();
    courses.forEach(c => cMap.set(c.id, c.code + " (" + c.name + ") - " + (c.isElective ? "Elective" : "Mandatory")));

    const faculty = await prisma.faculty.findMany({ include: { subjects: true } });
    console.log("=== FACULTY SUBJECTS ===");
    faculty.forEach(f => {
        console.log(f.name, "Subjects:", f.subjects.map(s => cMap.get(s.courseId) || s.courseId));
    });

    const unassignedMandatory = courses.filter(c => !c.isElective && !faculty.some(f => f.subjects.some(s => s.courseId === c.id)));
    console.log("\n=== UNASSIGNED MANDATORY COURSES ===");
    unassignedMandatory.forEach(c => console.log(c.code, "-", c.name));
}

check().then(() => prisma.$disconnect()).catch(console.error);
