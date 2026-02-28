import * as admin from 'firebase-admin';
import * as fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const saPath = process.env.FIREBASE_SERVICE_ACCOUNT;
    console.log('Service Account Path:', saPath);

    if (!saPath) {
        console.error('FIREBASE_SERVICE_ACCOUNT not set in .env');
        return;
    }

    if (!fs.existsSync(saPath)) {
        console.error('Service Account file DOES NOT EXIST at path:', saPath);
        return;
    }

    try {
        const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
        console.log('Project ID from SA:', sa.project_id);
        console.log('Client Email from SA:', sa.client_email);

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(sa)
            });
        }
        console.log('Firebase Admin Initialized Successfully');

        // Test listing users
        const listUsers = await admin.auth().listUsers(100);
        console.log('--- ALL FIREBASE USERS ---');
        listUsers.users.forEach(u => {
            console.log(`Email: ${u.email} | UID: ${u.uid}`);
        });
        console.log('--- END OF LIST ---');

    } catch (e: any) {
        console.error('Firebase Initialization Error:', e.message);
    }
}

main();
