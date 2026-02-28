
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const batches = await prisma.batch.findMany({
        select: { id: true, name: true, program: true, semester: true }
    });
    console.log('--- BATCHES ---');
    console.log(JSON.stringify(batches, null, 2));

    const courses = await prisma.course.findMany({
        select: { id: true, name: true, program: true, semester: true, weeklyHrs: true }
    });
    console.log('\n--- COURSES ---');
    console.log(JSON.stringify(courses, null, 2));

    await prisma.$disconnect();
}

check();
