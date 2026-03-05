import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

const STORAGE_DIR = path.join(process.cwd(), 'storage');
const EXCEL_FILE_PATH = path.join(STORAGE_DIR, 'subscribers.xlsx');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Helper to update the local Excel file
const updateExcelFile = async (subscriber: { id: string, email: string, status: string, createdAt: Date }) => {
    const workbook = new ExcelJS.Workbook();
    let worksheet;

    if (fs.existsSync(EXCEL_FILE_PATH)) {
        await workbook.xlsx.readFile(EXCEL_FILE_PATH);
        worksheet = workbook.getWorksheet('Subscribers');
    }

    if (!worksheet) {
        worksheet = workbook.addWorksheet('Subscribers');
        worksheet.columns = [
            { header: 'S.No', key: 'sno', width: 10 },
            { header: 'ID', key: 'id', width: 40 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Subscription Date', key: 'createdAt', width: 30 },
        ];
    }

    const rowCount = worksheet.rowCount;
    worksheet.addRow({
        sno: rowCount, // Since rowCount includes header, next row index works as S.No
        id: subscriber.id,
        email: subscriber.email,
        status: subscriber.status,
        createdAt: subscriber.createdAt.toISOString()
    });

    await workbook.xlsx.writeFile(EXCEL_FILE_PATH);
};

export const subscribe = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'Valid email is required' });
        }

        // Check for duplicate
        const existing = await prisma.subscriber.findUnique({
            where: { email }
        });

        if (existing) {
            return res.status(400).json({ error: 'Email already subscribed' });
        }

        const newSubscriber = await prisma.subscriber.create({
            data: { email }
        });

        // Async update to Excel so it doesn't block the response (or await it for safety)
        await updateExcelFile(newSubscriber).catch(err => {
            console.error('Failed to update Excel file:', err);
        });

        return res.status(201).json({ message: 'Subscribed successfully', data: newSubscriber });
    } catch (error) {
        console.error('Subscribe Error:', error);
        return res.status(500).json({ error: 'Failed to subscribe' });
    }
};

export const getSubscribers = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search ? String(req.query.search) : '';
        const sortField = req.query.sortBy ? String(req.query.sortBy) : 'createdAt';
        const sortOrder = req.query.order === 'asc' ? 'asc' : 'desc';

        const skip = (page - 1) * limit;

        const whereClause = search ? {
            email: { contains: search, mode: 'insensitive' as const }
        } : {};

        const [subscribers, total] = await Promise.all([
            prisma.subscriber.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { [sortField]: sortOrder }
            }),
            prisma.subscriber.count({ where: whereClause })
        ]);

        return res.json({
            data: subscribers,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get Subscribers Error:', error);
        return res.status(500).json({ error: 'Failed to fetch subscribers' });
    }
};

export const getSubscribersStats = async (req: Request, res: Response) => {
    try {
        const total = await prisma.subscriber.count();
        const active = await prisma.subscriber.count({ where: { status: 'ACTIVE' } });
        const unsubscribed = await prisma.subscriber.count({ where: { status: 'UNSUBSCRIBED' } });

        return res.json({ total, active, unsubscribed });
    } catch (error) {
        console.error('Get Stats Error:', error);
        return res.status(500).json({ error: 'Failed to fetch subscriber stats' });
    }
};

export const updateSubscriberStatus = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { status } = req.body;

        if (!['ACTIVE', 'UNSUBSCRIBED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const subscriber = await prisma.subscriber.update({
            where: { id },
            data: { status }
        });

        return res.json(subscriber);
    } catch (error) {
        console.error('Update Status Error:', error);
        return res.status(500).json({ error: 'Failed to update status' });
    }
};

export const deleteSubscriber = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await prisma.subscriber.delete({ where: { id } });
        return res.json({ message: 'Subscriber deleted successfully' });
    } catch (error) {
        console.error('Delete Error:', error);
        return res.status(500).json({ error: 'Failed to delete subscriber' });
    }
};

export const exportSubscribers = async (req: Request, res: Response) => {
    try {
        const querySearch = req.query.search ? String(req.query.search) : '';
        const whereClause = querySearch ? {
            email: { contains: querySearch, mode: 'insensitive' as const }
        } : {};

        const subscribers = await prisma.subscriber.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Subscribers Export');

        worksheet.columns = [
            { header: 'S.No', key: 'sno', width: 10 },
            { header: 'ID', key: 'id', width: 40 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Subscription Date', key: 'createdAt', width: 30 },
        ];

        subscribers.forEach((sub, index) => {
            worksheet.addRow({
                sno: index + 1,
                id: sub.id,
                email: sub.email,
                status: sub.status,
                createdAt: sub.createdAt.toISOString()
            });
        });

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=' + 'subscribers_export.xlsx'
        );

        await workbook.xlsx.write(res);
        return res.end();
    } catch (error) {
        console.error('Export Error:', error);
        return res.status(500).json({ error: 'Failed to export subscribers' });
    }
};
