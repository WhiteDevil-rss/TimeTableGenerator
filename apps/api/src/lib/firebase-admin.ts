import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;

if (serviceAccountPath) {
    // If a service account path is provided (local development or manual path)
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(readFileSync(serviceAccountPath, 'utf8'))),
        });
    }
} else {
    // Falls back to standard Google Application Credentials (GCP/Cloud Run)
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
        });
    }
}

export const firebaseAdmin = admin;
