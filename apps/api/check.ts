import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    const faculty = await prisma.faculty.findMany({ select: { name: true, maxHrsPerDay: true, maxHrsPerWeek: true } });
    console.table(faculty);
}
check().then(() => prisma.$disconnect()).catch(console.error);
