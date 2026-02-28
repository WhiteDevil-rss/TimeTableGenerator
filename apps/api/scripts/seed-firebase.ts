import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;
const prisma = new PrismaClient();

if (!serviceAccountPath) {
    console.error('ERROR: FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
    process.exit(1);
}

try {
    const serviceAccount = require(path.resolve(serviceAccountPath));
    console.log(`Initializing Firebase Admin for project: ${serviceAccount.project_id}`);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
} catch (error) {
    console.error(`ERROR: Failed to load service account from ${serviceAccountPath}`);
    console.error(error);
    process.exit(1);
}

const auth = admin.auth();

async function seedFirebase() {
    console.log('--- Starting Firebase User Seeding & UID Sync ---');

    try {
        const seedDataPath = path.join(__dirname, '../prisma/seed-data.json');
        const seedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));
        const users = seedData.users;

        console.log(`Found ${users.length} users in seed data.`);

        for (const user of users) {
            try {
                let firebaseUser;
                try {
                    // 1. Try to find existing Firebase user by email
                    firebaseUser = await auth.getUserByEmail(user.email);
                    console.log(`[EXISTING] User found in Firebase: ${user.email}`);
                } catch (e: any) {
                    if (e.code === 'auth/user-not-found') {
                        // 2. Create user if not found
                        firebaseUser = await auth.createUser({
                            uid: user.id,
                            email: user.email,
                            password: 'password123',
                            displayName: user.username,
                        });
                        console.log(`[CREATED] User created in Firebase: ${user.email}`);
                    } else {
                        throw e;
                    }
                }

                // 3. Sync UID to local database
                await prisma.user.update({
                    where: { email: user.email },
                    data: { firebaseUid: firebaseUser.uid }
                });
                console.log(`[SYNCED] Database record updated for: ${user.email}`);

            } catch (error: any) {
                console.error(`[ERROR] Failed to process ${user.email}:`, error.message);
            }
        }

        console.log('--- Firebase Seeding & Sync Complete ---');
    } catch (error: any) {
        console.error('CRITICAL ERROR during seeding:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

seedFirebase();
