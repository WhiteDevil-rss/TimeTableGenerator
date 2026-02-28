import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getPrograms = async (req: AuthRequest, res: Response) => {
    try {
        const filters: any = {};
        if (req.user!.role === 'UNI_ADMIN') filters.universityId = req.user!.universityId;
        if (req.user!.role === 'DEPT_ADMIN') {
            // Get the department's universityId
            const dept = await prisma.department.findUnique({ where: { id: req.user!.entityId! } });
            if (dept) filters.universityId = dept.universityId;
        }
        const programs = await prisma.program.findMany({ where: filters, orderBy: { name: 'asc' } });
        res.json(programs);
    } catch {
        res.status(500).json({ error: 'Failed to fetch programs' });
    }
};

export const getProgramById = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const program = await prisma.program.findUnique({ where: { id } });
        if (!program) return res.status(404).json({ error: 'Program not found' });
        res.json(program);
    } catch {
        res.status(500).json({ error: 'Failed to fetch program' });
    }
};

export const createProgram = async (req: AuthRequest, res: Response) => {
    try {
        const { name, shortName, type, duration, totalSems, universityId } = req.body;
        if (!name || !shortName || !type) {
            return res.status(400).json({ error: 'Name, shortName, and type are required' });
        }

        let resolvedUniversityId = universityId;
        if (!resolvedUniversityId && req.user!.role === 'DEPT_ADMIN') {
            const dept = await prisma.department.findUnique({ where: { id: req.user!.entityId! } });
            resolvedUniversityId = dept?.universityId;
        }
        if (!resolvedUniversityId && req.user!.role === 'UNI_ADMIN') {
            resolvedUniversityId = req.user!.universityId;
        }

        if (!resolvedUniversityId) {
            return res.status(400).json({ error: 'Could not determine universityId' });
        }

        const program = await prisma.program.create({
            data: {
                name,
                shortName,
                type,
                duration: duration ?? 2,
                totalSems: totalSems ?? 4,
                universityId: resolvedUniversityId,
            }
        });
        res.status(201).json(program);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'A program with this short name already exists.' });
        }
        res.status(500).json({ error: 'Failed to create program' });
    }
};

export const updateProgram = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { name, shortName, type, duration, totalSems } = req.body;
        const program = await prisma.program.update({
            where: { id },
            data: { name, shortName, type, duration, totalSems },
        });
        res.json(program);
    } catch (error: any) {
        if (error.code === 'P2025') return res.status(404).json({ error: 'Program not found' });
        res.status(500).json({ error: 'Failed to update program' });
    }
};

export const deleteProgram = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        await prisma.program.delete({ where: { id } });
        res.json({ message: 'Program deleted' });
    } catch (error: any) {
        if (error.code === 'P2025') return res.status(404).json({ error: 'Program not found' });
        res.status(500).json({ error: 'Failed to delete program' });
    }
};
