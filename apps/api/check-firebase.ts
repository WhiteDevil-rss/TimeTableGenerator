import { firebaseAdmin } from './src/lib/firebase-admin';

async function main() {
    const emails = ['admin@nep-scheduler.com', 'admin@vnsgu.ac.in', 'admin_dcs@vnsgu.ac.in'];

    console.log('--- FIREBASE USER CHECK ---');
    for (const email of emails) {
        try {
            const user = await firebaseAdmin.auth().getUserByEmail(email);
            console.log(`Email: ${email} | UID: ${user.uid} | Verified: ${user.emailVerified}`);
        } catch (e: any) {
            console.error(`Email: ${email} | ERROR: ${e.code}`);
        }
    }
    console.log('---------------------------');
}

main();
