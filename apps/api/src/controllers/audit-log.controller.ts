import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const {
            page = 1,
            limit = 50,
            search,
            status,
            entityType,
            userId,
            startDate,
            endDate
        } = req.query;

        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const where: any = {};

        if (status) where.status = status;
        if (entityType) where.entityType = entityType;
        if (userId) where.userId = userId;

        if (search) {
            where.OR = [
                { action: { contains: String(search), mode: 'insensitive' } },
                { entityId: { contains: String(search), mode: 'insensitive' } },
                { ipAddress: { contains: String(search), mode: 'insensitive' } },
            ];
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(String(startDate));
            if (endDate) where.createdAt.lte = new Date(String(endDate));
        }

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { username: true } } }
            }),
            prisma.auditLog.count({ where })
        ]);

        res.json({
            logs,
            pagination: {
                total,
                pages: Math.ceil(total / take),
                currentPage: Number(page),
                limit: take
            }
        });
    } catch (error) {
        console.error('Failed to fetch audit logs:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
};

export const exportAuditLogs = async (req: Request, res: Response) => {
    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5000 // Limit for CSV export to avoid memory issues
        });

        // Simple CSV generation
        const headers = ['ID', 'User ID', 'Action', 'Entity', 'Status', 'IP', 'Timestamp'];
        const rows = logs.map(l => [
            l.id,
            l.userId || 'N/A',
            l.action,
            `${l.entityType || ''} (${l.entityId || ''})`,
            (l as any).status,
            l.ipAddress || '',
            l.createdAt.toISOString()
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
        res.status(200).send(csv);
    } catch (error) {
        res.status(500).json({ error: 'Export failed' });
    }
};
