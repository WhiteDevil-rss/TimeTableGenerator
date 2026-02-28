import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('Exporting current database data to seed-data.json...');

    // Fetch data from all major tables
    const universities = await prisma.university.findMany();
    const users = await prisma.user.findMany();
    const departments = await prisma.department.findMany();
    const resources = await prisma.resource.findMany();
    const batches = await prisma.batch.findMany();
    const courses = await prisma.course.findMany();
    const faculty = await prisma.faculty.findMany();
    const facultyDepartments = await prisma.facultyDepartment.findMany();
    const facultySubjects = await prisma.facultySubject.findMany();
    const timetables = await prisma.timetable.findMany({
        include: {
            slots: true
        }
    });

    const data = {
        universities,
        users,
        departments,
        resources,
        batches,
        courses,
        faculty,
        facultyDepartments,
        facultySubjects,
        timetables,
        exportedAt: new Date().toISOString()
    };

    const outputPath = path.resolve(__dirname, 'seed-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

    console.log(`Successfully exported data to ${outputPath}`);
    console.log(`Universities: ${universities.length}`);
    console.log(`Users: ${users.length}`);
    console.log(`Departments: ${departments.length}`);
    console.log(`Resources: ${resources.length}`);
    console.log(`Batches: ${batches.length}`);
    console.log(`Courses: ${courses.length}`);
    console.log(`Faculty: ${faculty.length}`);
    console.log(`Faculty-Dept Associations: ${facultyDepartments.length}`);
    console.log(`Timetables: ${timetables.length}`);
}

main()
    .catch((e) => {
        console.error('Error exporting data:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
