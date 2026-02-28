import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { firebaseAdmin } from '../lib/firebase-admin';
import prisma from '../lib/prisma';
import { logAction } from '../lib/logger';

export interface CreateUserData {
    username: string;
    email: string;
    password?: string;
    role: string;
    universityId?: string;
    entityId?: string;
}

export interface UpdateUserData {
    username?: string;
    email?: string;
    role?: string;
    universityId?: string;
    entityId?: string;
    isActive?: boolean;
}

export class UserService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = prisma;
    }


    async createUser(data: CreateUserData, actorId: string) {
        const { username, email, password, role, universityId, entityId } = data;

        // Check for existing user
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email: email || '' }
                ]
            }
        });

        if (existingUser) {
            throw new Error('Username or email already exists');
        }

        let firebaseUid: string | undefined;

        try {
            // 1. Create in Firebase
            const firebaseRecord = await firebaseAdmin.auth().createUser({
                email,
                password: password || 'Welcome@123', // Default if not provided
                displayName: username,
            });
            firebaseUid = firebaseRecord.uid;

            // 2. Create in Postgres
            const passwordHash = password ? await bcrypt.hash(password, 12) : null;

            const user = await this.prisma.user.create({
                data: {
                    username,
                    email,
                    passwordHash,
                    firebaseUid,
                    role,
                    universityId: universityId || null,
                    entityId: entityId || null,
                }
            });

            await logAction({
                userId: actorId,
                action: 'CREATE_USER',
                entityType: 'USER',
                entityId: user.id,
                changes: { role, universityId },
                status: 'SUCCESS'
            });

            return user;
        } catch (error: any) {
            // Cleanup Firebase if Postgres fails
            if (firebaseUid) {
                await firebaseAdmin.auth().deleteUser(firebaseUid).catch(console.error);
            }
            throw error;
        }
    }

    async updateUser(id: string, data: UpdateUserData, actorId: string) {
        const currentUser = await this.prisma.user.findUnique({ where: { id } });
        if (!currentUser) throw new Error('User not found');

        // Check uniqueness if username/email changed
        if (data.username || data.email) {
            const existing = await this.prisma.user.findFirst({
                where: {
                    id: { not: id },
                    OR: [
                        ...(data.username ? [{ username: data.username }] : []),
                        ...(data.email ? [{ email: data.email }] : [])
                    ]
                }
            });
            if (existing) throw new Error('Username or email already in use');
        }

        // Sync with Firebase if needed
        if (data.email || data.username || data.isActive !== undefined) {
            if (currentUser.firebaseUid) {
                await firebaseAdmin.auth().updateUser(currentUser.firebaseUid, {
                    email: data.email,
                    displayName: data.username,
                    disabled: data.isActive === false
                });
            }
        }

        const updatedUser = await this.prisma.user.update({
            where: { id },
            data,
        });

        await logAction({
            userId: actorId,
            action: 'UPDATE_USER',
            entityType: 'USER',
            entityId: id,
            changes: data,
            status: 'SUCCESS'
        });

        return updatedUser;
    }

    async toggleUserStatus(id: string, isActive: boolean, actorId: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new Error('User not found');

        if (user.firebaseUid) {
            await firebaseAdmin.auth().updateUser(user.firebaseUid, {
                disabled: !isActive
            });
        }

        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: { isActive }
        });

        await logAction({
            userId: actorId,
            action: 'TOGGLE_USER_STATUS',
            entityType: 'USER',
            entityId: id,
            changes: { isActive },
            status: 'SUCCESS'
        });

        return updatedUser;
    }

    async deleteUser(id: string, actorId: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new Error('User not found');

        if (user.firebaseUid) {
            await firebaseAdmin.auth().deleteUser(user.firebaseUid);
        }

        await this.prisma.user.delete({ where: { id } });

        await logAction({
            userId: actorId,
            action: 'DELETE_USER',
            entityType: 'USER',
            entityId: id,
            status: 'SUCCESS'
        });

        return { success: true };
    }

    async resetPassword(id: string, newPassword: string, actorId: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new Error('User not found');

        if (user.firebaseUid) {
            await firebaseAdmin.auth().updateUser(user.firebaseUid, {
                password: newPassword
            });
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);
        await this.prisma.user.update({
            where: { id },
            data: { passwordHash }
        });

        await logAction({
            userId: actorId,
            action: 'RESET_PASSWORD',
            entityType: 'USER',
            entityId: id,
            status: 'SUCCESS'
        });

        return { success: true };
    }
}

export const userService = new UserService();
