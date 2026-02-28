import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { userService } from '../services/user.service';

/**
 * Helper to get scoping filters for listing users
 */
const getScopedFilter = (req: Request) => {
    const user = (req as any).user;
    if (!user) return {};

    switch (user.role) {
        case 'SUPERADMIN':
            return {};
        case 'UNI_ADMIN':
            return { universityId: user.universityId };
        case 'DEPT_ADMIN':
            return {
                universityId: user.universityId,
                entityId: user.entityId
            };
        default:
            return { id: user.id }; // Regular users only see themselves
    }
};

/**
 * Helper to validate if actor has permission to manage target user
 */
const validateAccess = (actor: any, target: any) => {
    if (actor.role === 'SUPERADMIN') return true;
    if (actor.id === target.id) return true; // Self-management

    if (actor.role === 'UNI_ADMIN') {
        return target.universityId === actor.universityId;
    }

    if (actor.role === 'DEPT_ADMIN') {
        return target.universityId === actor.universityId && target.entityId === actor.entityId;
    }

    return false;
};

export const getUsers = async (req: Request, res: Response) => {
    try {
        const filter = getScopedFilter(req);
        const users = await prisma.user.findMany({
            where: filter,
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                lastLogin: true,
                universityId: true,
                entityId: true,
                university: { select: { shortName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve users' });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const actor = (req as any).user;
        const { username, email, password, role, universityId, entityId } = req.body;

        // Scoping for creation
        if (actor.role === 'UNI_ADMIN' && universityId !== actor.universityId) {
            return res.status(403).json({ error: 'Scope mismatch: Cannot create for other university' });
        }
        if (actor.role === 'DEPT_ADMIN' && (universityId !== actor.universityId || entityId !== actor.entityId)) {
            return res.status(403).json({ error: 'Scope mismatch: Cannot create for other department' });
        }

        const user = await userService.createUser({
            username, email, password, role, universityId, entityId
        }, actor.id);

        res.status(201).json(user);
    } catch (err: any) {
        console.error(err);
        res.status(400).json({ error: err.message || 'Failed to create user' });
    }
};

export const updateUserStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const actor = (req as any).user;

        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        if (!validateAccess(actor, targetUser)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        // Prevent self-disabling for admins to avoid locking themselves out
        if (actor.id === id && isActive === false && (actor.role === 'SUPERADMIN' || actor.role === 'UNI_ADMIN')) {
            return res.status(403).json({ error: 'You cannot disable your own admin account' });
        }

        const user = await userService.toggleUserStatus(id, isActive, actor.id);
        res.json(user);
    } catch (err: any) {
        console.error(err);
        res.status(400).json({ error: err.message || 'Failed to update user status' });
    }
};

export const resetUserPassword = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        const actor = (req as any).user;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        if (!validateAccess(actor, targetUser)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        await userService.resetPassword(id, newPassword, actor.id);
        res.json({ message: 'Password reset successfully' });
    } catch (err: any) {
        console.error(err);
        res.status(400).json({ error: err.message || 'Failed to reset password' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const actor = (req as any).user;
        const data = req.body;

        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        if (!validateAccess(actor, targetUser)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        // Restrict sensitive field updates for non-admins during self-service
        if (actor.role !== 'SUPERADMIN' && actor.role !== 'UNI_ADMIN') {
            delete data.role;
            delete data.universityId;
            delete data.entityId;
        }

        const user = await userService.updateUser(id, data, actor.id);
        res.json(user);
    } catch (err: any) {
        console.error(err);
        res.status(400).json({ error: err.message || 'Failed to update user' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const actor = (req as any).user;

        if (actor.id === id) {
            return res.status(403).json({ error: 'You cannot delete your own account' });
        }

        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        if (!validateAccess(actor, targetUser)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        await userService.deleteUser(id, actor.id);
        res.json({ message: 'User deleted successfully' });
    } catch (err: any) {
        console.error(err);
        res.status(400).json({ error: err.message || 'Failed to delete user' });
    }
};
