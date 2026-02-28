import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../middlewares/auth.middleware';
import { logActivity } from '../utils/activity-logger';

const hashPassword = async (password: string) => bcrypt.hash(password, 12);

export const getDepartments = async (req: AuthRequest, res: Response) => {
    try {
        const { universityId } = req.params;
        console.log('[DEBUG] GET /departments -> universityId param:', universityId, 'User:', req.user?.universityId);

        // Authorization Check: SUPERADMIN can see all, UNI_ADMIN can see own
        if (req.user!.role === 'UNI_ADMIN' && String(req.user!.universityId) !== String(universityId)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const departments = await prisma.department.findMany({
            where: { universityId },
            include: {
                _count: {
                    select: { faculty: true, courses: true, batches: true }
                }
            }
        });
        res.json(departments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
};

export const getDepartmentById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const department = await prisma.department.findUnique({
            where: { id },
        });

        if (!department) return res.status(404).json({ error: 'Not found' });

        // Authorization Check
        if (req.user!.role === 'UNI_ADMIN' && req.user!.universityId !== department.universityId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        res.json(department);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch department' });
    }
};

export const createDepartment = async (req: AuthRequest, res: Response) => {
    try {
        const { universityId } = req.params;
        const { name, shortName, hod, email, adminUsername, adminPassword } = req.body;

        if (req.user!.role === 'UNI_ADMIN' && String(req.user!.universityId) !== String(universityId)) {
            return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
        }

        const existingUser = await prisma.user.findUnique({ where: { username: adminUsername } });
        if (existingUser) {
            return res.status(400).json({ error: 'The provided Admin Username is already taken globally. Please choose another.' });
        }

        const department = await prisma.$transaction(async (tx: any) => {
            const dept = await tx.department.create({
                data: { universityId, name, shortName, hod, email }
            });

            const pwdHash = await hashPassword(adminPassword);

            const admin = await tx.user.create({
                data: {
                    username: adminUsername,
                    passwordHash: pwdHash,
                    role: 'DEPT_ADMIN',
                    universityId,
                    entityId: dept.id
                }
            });

            await tx.department.update({
                where: { id: dept.id },
                data: { adminUserId: admin.id }
            });

            return tx.department.findUnique({ where: { id: dept.id } });
        });

        res.status(201).json(department);

        logActivity(
            req.user!.id,
            req.user!.role,
            'DEPARTMENT_CREATE',
            { departmentId: department?.id, name: department?.name }
        );
    } catch (error) {
        console.error('Create Department Error:', error);
        res.status(500).json({ error: 'Failed to create department', details: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const updateDepartment = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, shortName, hod, email } = req.body;

        const targetDept = await prisma.department.findUnique({ where: { id } });
        if (!targetDept) return res.status(404).json({ error: 'Not found' });

        if (req.user!.role === 'UNI_ADMIN' && req.user!.universityId !== targetDept.universityId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const department = await prisma.department.update({
            where: { id },
            data: { name, shortName, hod, email }
        });

        res.json(department);

        logActivity(
            req.user!.id,
            req.user!.role,
            'DEPARTMENT_UPDATE',
            { departmentId: department.id, name: department.name }
        );
    } catch (error) {
        res.status(500).json({ error: 'Failed to update department' });
    }
};

export const deleteDepartment = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const targetDept = await prisma.department.findUnique({ where: { id } });
        if (!targetDept) return res.status(404).json({ error: 'Not found' });

        if (req.user!.role === 'UNI_ADMIN' && req.user!.universityId !== targetDept.universityId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await prisma.department.delete({ where: { id } });
        res.status(204).send();

        logActivity(
            req.user!.id,
            req.user!.role,
            'DEPARTMENT_DELETE',
            { departmentId: id, name: targetDept.name }
        );
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete department' });
    }
};
