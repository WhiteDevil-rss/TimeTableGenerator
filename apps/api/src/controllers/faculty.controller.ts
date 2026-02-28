import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../middlewares/auth.middleware';
import { logActivity } from '../utils/activity-logger';

const hashPassword = async (password: string) => bcrypt.hash(password, 12);

export const getFaculty = async (req: AuthRequest, res: Response) => {
    try {
        const { universityId, departmentId } = req.query as { universityId?: string, departmentId?: string };

        // Authorization checks
        if (req.user!.role === 'UNI_ADMIN' && req.user!.universityId !== universityId && universityId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (req.user!.role === 'DEPT_ADMIN' && req.user!.entityId !== departmentId && departmentId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const filters: any = {};
        if (universityId) filters.universityId = universityId;
        if (departmentId) {
            filters.departments = {
                some: { departmentId: departmentId }
            };
        }

        // Default fallback to user's scope if no query params
        if (req.user!.role === 'UNI_ADMIN' && !universityId) filters.universityId = req.user!.universityId;
        if (req.user!.role === 'DEPT_ADMIN' && !departmentId) {
            filters.departments = {
                some: { departmentId: req.user!.entityId }
            };
        }

        const faculty = await prisma.faculty.findMany({
            where: filters,
            include: {
                subjects: { include: { course: true } },
                departments: { include: { department: true } }
            }
        });
        res.json(faculty);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch faculty' });
    }
};

export const getFacultyById = async (req: AuthRequest, res: Response) => {
    try {
        const faculty = await prisma.faculty.findUnique({
            where: { id: req.params.id as string },
            include: {
                subjects: { include: { course: true } },
                departments: { include: { department: true } }
            }
        }) as any;

        if (!faculty) return res.status(404).json({ error: 'Not found' });

        // Authorization checks
        if (req.user!.role === 'UNI_ADMIN' && String(req.user!.universityId) !== String(faculty.universityId)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (req.user!.role === 'DEPT_ADMIN') {
            const hasAccess = faculty.departments.some((d: any) => d.departmentId === req.user!.entityId);
            if (!hasAccess) return res.status(403).json({ error: 'Forbidden' });
        }
        if (req.user!.role === 'FACULTY' && String(req.user!.entityId) !== String(faculty.id)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        res.json(faculty);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch faculty' });
    }
};

export const createFaculty = async (req: AuthRequest, res: Response) => {
    try {
        const { universityId, departmentIds, name, email, designation, maxHrsPerDay, password } = req.body;

        // Authorization checks
        if (req.user!.role === 'UNI_ADMIN' && req.user!.universityId !== universityId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (req.user!.role === 'DEPT_ADMIN') {
            // DEPT_ADMIN can only create within their department
            if (!departmentIds || !departmentIds.includes(req.user!.entityId)) {
                return res.status(403).json({ error: 'Forbidden' });
            }
        }

        const faculty = await prisma.$transaction(async (tx) => {
            const pwdHash = await hashPassword(password);

            const user = await tx.user.create({
                data: {
                    username: email.split('@')[0],
                    email,
                    passwordHash: pwdHash,
                    role: 'FACULTY',
                    universityId
                }
            });

            const fac = await tx.faculty.create({
                data: {
                    universityId,
                    name,
                    email,
                    designation,
                    maxHrsPerDay: maxHrsPerDay || 4,
                    userId: user.id,
                    departments: {
                        create: departmentIds.map((id: string) => ({ departmentId: id }))
                    }
                }
            });

            await tx.user.update({
                where: { id: user.id },
                data: { entityId: fac.id }
            });

            return fac;
        });

        res.status(201).json(faculty);

        logActivity(
            req.user!.id,
            req.user!.role,
            'FACULTY_CREATE',
            { facultyId: faculty.id, name: faculty.name, departmentId: departmentIds?.[0] }
        );
    } catch (error) {
        res.status(500).json({ error: 'Failed to create faculty' });
    }
};

export const updateFaculty = async (req: AuthRequest, res: Response) => {
    try {
        const { name, email, phone, designation, maxHrsPerDay, departmentIds } = req.body;

        const targetFac = await prisma.faculty.findUnique({
            where: { id: req.params.id as string },
            include: { departments: true }
        }) as any;
        if (!targetFac) return res.status(404).json({ error: 'Not found' });

        // Authorization checks
        if (req.user!.role === 'UNI_ADMIN' && req.user!.universityId !== targetFac.universityId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (req.user!.role === 'DEPT_ADMIN') {
            const hasAccess = targetFac.departments.some((d: any) => d.departmentId === req.user!.entityId);
            if (!hasAccess) return res.status(403).json({ error: 'Forbidden' });
        }

        const faculty = await prisma.faculty.update({
            where: { id: req.params.id as string },
            data: {
                name,
                email,
                phone,
                designation,
                maxHrsPerDay,
                departments: departmentIds ? {
                    deleteMany: {},
                    create: departmentIds.map((id: string) => ({ departmentId: id }))
                } : undefined
            }
        });

        res.json(faculty);

        logActivity(
            req.user!.id,
            req.user!.role,
            'FACULTY_UPDATE',
            { facultyId: faculty.id, name: faculty.name }
        );
    } catch (error) {
        res.status(500).json({ error: 'Failed to update faculty' });
    }
};

export const deleteFaculty = async (req: AuthRequest, res: Response) => {
    try {
        const targetFac = await prisma.faculty.findUnique({
            where: { id: req.params.id as string },
            include: { departments: true }
        }) as any;
        if (!targetFac) return res.status(404).json({ error: 'Not found' });

        if (req.user!.role === 'UNI_ADMIN' && req.user!.universityId !== targetFac.universityId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (req.user!.role === 'DEPT_ADMIN') {
            const hasAccess = targetFac.departments.some((d: any) => d.departmentId === req.user!.entityId);
            if (!hasAccess) return res.status(403).json({ error: 'Forbidden' });
        }

        await prisma.faculty.delete({ where: { id: req.params.id as string } });
        if (targetFac.userId) {
            await prisma.user.delete({ where: { id: targetFac.userId } });
        }

        res.status(204).send();

        logActivity(
            req.user!.id,
            req.user!.role,
            'FACULTY_DELETE',
            { facultyId: req.params.id, name: targetFac.name }
        );
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete faculty' });
    }
};
