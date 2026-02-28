import * as admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT || '');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const prisma = new PrismaClient();

async function check() {
    try {
        const user = await admin.auth().getUserByEmail('admin@galgotias.com');
        console.log('Firebase user exists:', user.uid);
    } catch (e: any) {
        console.log('Firebase error:', e.message);
    }

    try {
        const pUser = await prisma.user.findFirst({ where: { username: 'admin_galgotias' } });
        console.log('Prisma user:', pUser ? pUser.id : 'not found');

        const pUni = await prisma.university.findFirst({ where: { shortName: 'GalU' } });
        console.log('Prisma uni:', pUni ? pUni.id : 'not found');

        // Also delete them so the user can recreate!
        if (pUni) await prisma.university.delete({ where: { id: pUni.id } });
        console.log('Cleaned up Prisma uni if existed');
    } catch (e: any) {
        console.log('Prisma error:', e.message);
    }
}

check().then(() => {
    return prisma.$disconnect();
}).catch(e => {
    console.error(e);
    process.exit(1);
});
