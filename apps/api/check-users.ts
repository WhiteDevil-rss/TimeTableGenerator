import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            select: {
                email: true,
                role: true,
                firebaseUid: true
            }
        });
        console.log('--- USERS IN DATABASE ---');
        console.table(users);
        console.log('-------------------------');
    } catch (e) {
        console.error('Error checking users:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
