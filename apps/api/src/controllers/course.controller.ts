import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getCourses = async (req: AuthRequest, res: Response) => {
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
        if (departmentId) filters.departmentId = departmentId;

        // Default fallback to user's scope if no query params
        if (req.user!.role === 'UNI_ADMIN' && !universityId) filters.universityId = req.user!.universityId;
        if (req.user!.role === 'DEPT_ADMIN' && !departmentId) filters.departmentId = req.user!.entityId;

        const courses = await prisma.course.findMany({ where: filters });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
};

export const getCourseById = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const course = await prisma.course.findUnique({ where: { id } });
        if (!course) return res.status(404).json({ error: 'Not found' });

        // Authorization checks
        if (req.user!.role === 'UNI_ADMIN' && req.user!.universityId !== course.universityId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (req.user!.role === 'DEPT_ADMIN' && req.user!.entityId !== course.departmentId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        res.json(course);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch course' });
    }
};

export const createCourse = async (req: AuthRequest, res: Response) => {
    try {
        const { universityId, departmentId, name, code, program, credits, weeklyHrs, type, semester } = req.body;

        // Authorization checks
        if (req.user!.role === 'UNI_ADMIN' && req.user!.universityId !== universityId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (req.user!.role === 'DEPT_ADMIN' && req.user!.entityId !== departmentId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const course = await prisma.course.create({
            data: { universityId, departmentId, name, code, program, credits, weeklyHrs, type, semester: semester ?? null }
        });

        res.status(201).json(course);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create course' });
    }
};

export const updateCourse = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { name, code, program, credits, weeklyHrs, type, semester } = req.body;

        const targetCourse = await prisma.course.findUnique({ where: { id } });
        if (!targetCourse) return res.status(404).json({ error: 'Not found' });

        if (req.user!.role === 'UNI_ADMIN' && req.user!.universityId !== targetCourse.universityId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (req.user!.role === 'DEPT_ADMIN' && req.user!.entityId !== targetCourse.departmentId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const course = await prisma.course.update({
            where: { id },
            data: { name, code, program, credits, weeklyHrs, type, semester: semester ?? null }
        });

        res.json(course);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update course' });
    }
};

export const deleteCourse = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const targetCourse = await prisma.course.findUnique({ where: { id } });
        if (!targetCourse) return res.status(404).json({ error: 'Not found' });

        if (req.user!.role === 'UNI_ADMIN' && req.user!.universityId !== targetCourse.universityId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (req.user!.role === 'DEPT_ADMIN' && req.user!.entityId !== targetCourse.departmentId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await prisma.course.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete course' });
    }
};
