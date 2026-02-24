import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    // Fetch data from all relevant tables
    const users = await prisma.user.findMany();
    const departments = await prisma.department.findMany();
    const courses = await prisma.course.findMany();
    const subjects = await prisma.subject.findMany();
    const batches = await prisma.batch.findMany();
    const resources = await prisma.resource.findMany();
    const timetables = await prisma.timetable.findMany({ include: { slots: true } });

    const data = {
        users,
        departments,
        courses,
        subjects,
        batches,
        resources,
        timetables,
    };

    const outputPath = path.resolve(__dirname, 'seed-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`Seed data written to ${outputPath}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
