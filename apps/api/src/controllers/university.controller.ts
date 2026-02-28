import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcrypt';
import { firebaseAdmin } from '../lib/firebase-admin';
import { logAction } from '../lib/logger';
const hashPassword = async (password: string) => bcrypt.hash(password, 12);

export const getAllUniversities = async (req: Request, res: Response) => {
    try {
        const universities = await prisma.university.findMany({
            include: {
                _count: {
                    select: { departments: true, faculty: true, courses: true }
                }
            }
        });
        res.json(universities);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch universities' });
    }
};

export const getUniversityById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const university = await prisma.university.findUnique({
            where: { id },
            include: { departments: true }
        });
        if (!university) return res.status(404).json({ error: 'Not found' });
        res.json(university);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch university' });
    }
};

export const createUniversity = async (req: Request, res: Response) => {
    try {
        const { name, shortName, location, email, adminUsername, adminPassword } = req.body;

        // Perform transaction to create University and its Admin User
        const university = await prisma.$transaction(async (tx: any) => {
            const uni = await tx.university.create({
                data: { name, shortName, location, email }
            });

            // 1. Create User in Firebase Auth (Make it non-blocking if there's a credential error)
            let firebaseUid = null;
            let firebaseUrlEmail = email || `${adminUsername}@${shortName.toLowerCase()}.edu`;
            try {
                const firebaseRecord = await firebaseAdmin.auth().createUser({
                    email: firebaseUrlEmail,
                    password: adminPassword,
                    displayName: adminUsername,
                });
                firebaseUid = firebaseRecord.uid;
                firebaseUrlEmail = firebaseRecord.email || firebaseUrlEmail;
            } catch (fbError: any) {
                console.warn("⚠️ Bypassing Firebase Auth Creation due to error:", fbError.message);
                // We generate a fake UID for local dev if Firebase is unreachable/invalid
                firebaseUid = `fake-firebase-uid-${Date.now()}`;
            }

            const pwdHash = await hashPassword(adminPassword);

            // 2. Create User in Postgres (Local DB)
            const admin = await tx.user.create({
                data: {
                    username: adminUsername,
                    email: firebaseUrlEmail,
                    passwordHash: pwdHash,
                    firebaseUid: firebaseUid, // Sync the UID!
                    role: 'UNI_ADMIN',
                    universityId: uni.id,
                    entityId: uni.id
                }
            });

            await tx.university.update({
                where: { id: uni.id },
                data: { adminUserId: admin.id }
            });

            return tx.university.findUnique({ where: { id: uni.id } });
        });

        res.status(201).json(university);
    } catch (error: any) {
        console.error("CREATE_UNI_ERROR:", error);
        res.status(500).json({ error: error.message || 'Failed to create university' });
    }
};

export const updateUniversity = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const actor = (req as any).user;
        const { name, shortName, location, email } = req.body;

        const university = await prisma.university.update({
            where: { id },
            data: { name, shortName, location, email }
        });

        // Enterprise Audit Log
        await logAction({
            userId: actor?.id,
            action: 'UPDATE_UNIVERSITY',
            entityType: 'UNIVERSITY',
            entityId: id,
            changes: req.body,
            status: 'SUCCESS'
        });

        res.json(university);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update university' });
    }
};

export const deleteUniversity = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const actor = (req as any).user;

        // 1. Fetch all users belonging to this university to clean up Firebase
        const users = await prisma.user.findMany({
            where: { universityId: id },
            select: { firebaseUid: true }
        });

        // 2. Delete users from Firebase Auth
        const firebaseUids = users.map(u => u.firebaseUid).filter(Boolean) as string[];

        // Delete in batches or individually if small
        for (const uid of firebaseUids) {
            try {
                await firebaseAdmin.auth().deleteUser(uid);
            } catch (fbError) {
                console.error(`Failed to delete Firebase user ${uid}:`, fbError);
                // Continue with others even if one fails
            }
        }

        // 3. Delete University from Postgres (Cascade handles the rest)
        await prisma.university.delete({ where: { id } });

        // Enterprise Audit Log
        await logAction({
            userId: actor?.id,
            action: 'DELETE_UNIVERSITY',
            entityType: 'UNIVERSITY',
            entityId: id,
            status: 'SUCCESS'
        });

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete university' });
    }
};
