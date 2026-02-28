import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getBatches = async (req: AuthRequest, res: Response) => {
    try {
        const { universityId, departmentId } = req.query as { universityId?: string, departmentId?: string };

        if (req.user!.role === 'UNI_ADMIN' && req.user!.universityId !== universityId && universityId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (req.user!.role === 'DEPT_ADMIN' && req.user!.entityId !== departmentId && departmentId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const filters: any = {};
        if (universityId) filters.universityId = universityId;
        if (departmentId) filters.departmentId = departmentId;

        if (req.user!.role === 'UNI_ADMIN' && !universityId) filters.universityId = req.user!.universityId;
        if (req.user!.role === 'DEPT_ADMIN' && !departmentId) filters.departmentId = req.user!.entityId;

        const batches = await prisma.batch.findMany({ where: filters, orderBy: { name: 'asc' } });
        res.json(batches);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch batches' });
    }
};

export const getBatchById = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const batch = await prisma.batch.findUnique({ where: { id } });
        if (!batch) return res.status(404).json({ error: 'Not found' });

        if (req.user!.role === 'UNI_ADMIN' && req.user!.universityId !== batch.universityId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (req.user!.role === 'DEPT_ADMIN' && req.user!.entityId !== batch.departmentId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        res.json(batch);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch batch' });
    }
};

export const createBatch = async (req: AuthRequest, res: Response) => {
    try {
        const { universityId, departmentId, name, program, semester, division, year, strength, totalStudents } = req.body;

        if (req.user!.role === 'UNI_ADMIN' && req.user!.universityId !== universityId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (req.user!.role === 'DEPT_ADMIN' && req.user!.entityId !== departmentId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const batch = await prisma.batch.create({
            data: { universityId, departmentId, name, program, semester, division, year, strength, totalStudents: totalStudents || 0 }
        });

        res.status(201).json(batch);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create batch' });
    }
};

export const updateBatch = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { name, program, semester, division, year, strength, totalStudents } = req.body;

        const targetBatch = await prisma.batch.findUnique({ where: { id } });
        if (!targetBatch) return res.status(404).json({ error: 'Not found' });

        if (req.user!.role === 'UNI_ADMIN' && req.user!.universityId !== targetBatch.universityId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (req.user!.role === 'DEPT_ADMIN' && req.user!.entityId !== targetBatch.departmentId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const batch = await prisma.batch.update({
            where: { id },
            data: { name, program, semester, division, year, strength, totalStudents }
        });

        res.json(batch);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update batch' });
    }
};

export const deleteBatch = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const targetBatch = await prisma.batch.findUnique({ where: { id } });
        if (!targetBatch) return res.status(404).json({ error: 'Not found' });

        if (req.user!.role === 'UNI_ADMIN' && req.user!.universityId !== targetBatch.universityId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (req.user!.role === 'DEPT_ADMIN' && req.user!.entityId !== targetBatch.departmentId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Cascade-delete: remove dependent timetable slots first, then timetable references
        await prisma.timetableSlot.deleteMany({ where: { batchId: id } });

        // Remove this batch from any timetables that reference it
        await prisma.timetable.updateMany({
            where: { batchId: id },
            data: { batchId: null }
        });

        await prisma.batch.delete({ where: { id } });
        res.status(204).send();
    } catch (error: any) {
        console.error('Delete batch error:', error);
        res.status(500).json({ error: 'Failed to delete batch', detail: error?.message });
    }
};
