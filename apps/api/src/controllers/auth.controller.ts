import { Response } from 'express';
import prisma from '../lib/prisma';
import { logActivity } from '../utils/activity-logger';
import { AuthRequest } from '../middlewares/auth.middleware';

/**
 * Sync point for frontend after Firebase login.
 * The 'authenticate' middleware already verified the token 
 * and attached the local user record to req.user.
 */
export const login = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;

        // Update lastLogin footprint
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });

        // Persistent Activity Log
        logActivity(
            user.id,
            user.role,
            'USER_LOGIN_FIREBASE',
            { method: 'firebase-auth', email: user.email, ip: req.ip }
        );

        res.json({
            user: {
                id: user.id,
                username: user.email?.split('@')[0] || 'user',
                role: user.role,
                entityId: user.entityId,
                universityId: user.universityId,
                email: user.email
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                entityId: true,
                universityId: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
