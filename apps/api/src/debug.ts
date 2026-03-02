import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkData() {
    const pythonCourse = await prisma.course.findFirst({
        where: { code: 'Python-204' },
        include: { department: true }
    });
    console.log('--- PYTHON COURSE ---');
    console.log(pythonCourse);

    const user = await prisma.user.findFirst({
        where: { username: 'admin_dcs_vnsgu' }
    });
    console.log('\n--- ADMIN USER ---');
    console.log(user);

    if (pythonCourse && user) {
        console.log(`\nCourse Dept ID: ${pythonCourse.departmentId}`);
        console.log(`Admin Entity ID: ${user.entityId}`);
        console.log(`Match? ${pythonCourse.departmentId === user.entityId}`);
    }
}

checkData()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
