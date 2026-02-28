import { Request, Response, NextFunction } from 'express';
import { firebaseAdmin } from '../lib/firebase-admin';
import prisma from '../lib/prisma';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
        entityId: string | null;
        universityId: string | null;
        email?: string;
    };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('Auth Middleware: Missing or invalid Authorization header');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    // Debug logging (safely)
    console.log('Auth Middleware: Token received, length:', token?.length);
    if (token) {
        console.log('Auth Middleware: Token start:', token.substring(0, 15), '... end:', token.substring(token.length - 15));
    }

    try {
        // Verify Firebase ID Token
        console.log('Auth Middleware: Verifying token with Firebase Admin...');
        const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
        const { uid, email } = decodedToken;

        // Lookup user in our DB by firebaseUid or email
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { firebaseUid: uid },
                    { email: email }
                ]
            }
        });

        if (!user) {
            return res.status(401).json({ error: 'User not registered in local database' });
        }

        // If user found by email but firebaseUid not set, sync it
        if (!user.firebaseUid) {
            await prisma.user.update({
                where: { id: user.id },
                data: { firebaseUid: uid }
            });
        }

        req.user = {
            id: user.id,
            role: user.role,
            entityId: user.entityId,
            universityId: user.universityId,
            email: user.email || undefined
        };

        next();
    } catch (err) {
        console.error('Auth Error:', err);
        return res.status(401).json({ error: 'Invalid or expired Firebase token' });
    }
};

export const requireRole = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
        }
        next();
    };
};
