import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getResources = async (req: AuthRequest, res: Response) => {
    try {
        const { universityId } = req.query as { universityId?: string };

        const isAdmin = ['UNI_ADMIN', 'DEPT_ADMIN'].includes(req.user!.role);
        if (isAdmin && req.user!.universityId !== universityId && universityId) {
            return res.status(403).json({ error: 'Forbidden' });
        }


        const filters: any = {};
        if (universityId) filters.universityId = universityId;
        if (isAdmin && !universityId) filters.universityId = req.user!.universityId;



        const resources = await prisma.resource.findMany({ where: filters });
        res.json(resources);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch resources' });
    }
};

export const getResourceById = async (req: AuthRequest, res: Response) => {
    try {
        const resource = await prisma.resource.findUnique({ where: { id: req.params.id } });
        if (!resource) return res.status(404).json({ error: 'Not found' });

        const isAdmin = ['UNI_ADMIN', 'DEPT_ADMIN'].includes(req.user!.role);
        if (isAdmin && req.user!.universityId !== resource.universityId) {
            return res.status(403).json({ error: 'Forbidden' });
        }


        res.json(resource);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch resource' });
    }
};

export const createResource = async (req: AuthRequest, res: Response) => {
    try {
        const { universityId, name, type, capacity, floor, building } = req.body;

        const isAdmin = ['UNI_ADMIN', 'DEPT_ADMIN'].includes(req.user!.role);
        if (isAdmin && req.user!.universityId !== universityId) {
            return res.status(403).json({ error: 'Forbidden' });
        }


        const resource = await prisma.resource.create({
            data: { universityId, name, type, capacity, floor, building }
        });

        res.status(201).json(resource);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create resource' });
    }
};

export const updateResource = async (req: AuthRequest, res: Response) => {
    try {
        const { name, type, capacity, floor, building } = req.body;

        const targetResource = await prisma.resource.findUnique({ where: { id: req.params.id } });
        if (!targetResource) return res.status(404).json({ error: 'Not found' });

        const isAdmin = ['UNI_ADMIN', 'DEPT_ADMIN'].includes(req.user!.role);
        if (isAdmin && req.user!.universityId !== targetResource.universityId) {
            return res.status(403).json({ error: 'Forbidden' });
        }


        const resource = await prisma.resource.update({
            where: { id: req.params.id },
            data: { name, type, capacity, floor, building }
        });

        res.json(resource);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update resource' });
    }
};

export const deleteResource = async (req: AuthRequest, res: Response) => {
    try {
        const targetResource = await prisma.resource.findUnique({ where: { id: req.params.id } });
        if (!targetResource) return res.status(404).json({ error: 'Not found' });

        const isAdmin = ['UNI_ADMIN', 'DEPT_ADMIN'].includes(req.user!.role);
        if (isAdmin && req.user!.universityId !== targetResource.universityId) {
            return res.status(403).json({ error: 'Forbidden' });
        }


        await prisma.resource.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete resource' });
    }
};
