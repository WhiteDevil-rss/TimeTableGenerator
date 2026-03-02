import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';
import prisma from '../lib/prisma';
import { logAction } from '../lib/logger';

const EXCEL_PATH = path.join(__dirname, '..', '..', 'inquiries.xlsx');

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Initialise or load the inquiries Excel workbook and worksheet. */
async function getOrCreateWorkbook(): Promise<{ wb: ExcelJS.Workbook; ws: ExcelJS.Worksheet }> {
    const wb = new ExcelJS.Workbook();

    if (fs.existsSync(EXCEL_PATH)) {
        await wb.xlsx.readFile(EXCEL_PATH);
    }

    let ws = wb.getWorksheet('Inquiries');
    if (!ws) {
        ws = wb.addWorksheet('Inquiries');
        ws.columns = [
            { header: 'ID', key: 'id', width: 38 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Contact', key: 'contactNumber', width: 18 },
            { header: 'Organization', key: 'organization', width: 30 },
            { header: 'Message', key: 'message', width: 50 },
            { header: 'Status', key: 'status', width: 14 },
            { header: 'IP Address', key: 'ipAddress', width: 18 },
            { header: 'Date', key: 'createdAt', width: 22 },
        ];

        // Style header row
        const headerRow = ws.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1E293B' },
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 24;
    }

    return { wb, ws };
}

/** Append a row to the Excel file without loading the whole file into memory. */
async function appendToExcel(inquiry: {
    id: string;
    name: string;
    email: string;
    contactNumber: string;
    organization?: string | null;
    message?: string | null;
    status: string;
    ipAddress?: string | null;
    createdAt: Date;
}) {
    try {
        const { wb, ws } = await getOrCreateWorkbook();
        ws.addRow({
            id: inquiry.id,
            name: inquiry.name,
            email: inquiry.email,
            contactNumber: inquiry.contactNumber,
            organization: inquiry.organization || '',
            message: inquiry.message || '',
            status: inquiry.status,
            ipAddress: inquiry.ipAddress || '',
            createdAt: inquiry.createdAt.toISOString(),
        });
        await wb.xlsx.writeFile(EXCEL_PATH);
    } catch (err) {
        console.error('[Excel] Failed to append inquiry row:', err);
    }
}

// ── PUBLIC: Create Inquiry ────────────────────────────────────────────────────

/**
 * POST /v1/inquiries
 * Public endpoint – no authentication required.
 */
export const createInquiry = async (req: Request, res: Response) => {
    try {
        const { name, email, contactNumber, organization, message } = req.body;

        // --- Validation ---
        if (!name || !email || !contactNumber) {
            return res.status(400).json({ error: 'Name, email, and contact number are required.' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format.' });
        }

        const phoneRegex = /^[\d\s\+\-\(\)]{7,20}$/;
        if (!phoneRegex.test(contactNumber)) {
            return res.status(400).json({ error: 'Invalid contact number.' });
        }

        // --- Sanitize ---
        const sanitized = {
            name: String(name).trim().substring(0, 200),
            email: String(email).trim().toLowerCase().substring(0, 254),
            contactNumber: String(contactNumber).trim().substring(0, 30),
            organization: organization ? String(organization).trim().substring(0, 300) : undefined,
            message: message ? String(message).trim().substring(0, 2000) : undefined,
            ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
                || req.socket?.remoteAddress
                || undefined,
        };

        // --- Persist ---
        const inquiry = await (prisma as any).inquiry.create({ data: sanitized });

        // --- Excel (fire-and-forget) ---
        appendToExcel(inquiry);

        // --- Audit Log ---
        logAction({
            action: 'CREATE_INQUIRY',
            entityType: 'INQUIRY',
            entityId: inquiry.id,
            changes: { name: sanitized.name, email: sanitized.email },
            status: 'SUCCESS',
            ipAddress: sanitized.ipAddress,
        });

        return res.status(201).json({ success: true, id: inquiry.id });
    } catch (error) {
        console.error('[Inquiry] Create error:', error);
        return res.status(500).json({ error: 'Failed to submit inquiry. Please try again.' });
    }
};

// ── SUPERADMIN: List Inquiries ────────────────────────────────────────────────

export const getAllInquiries = async (req: Request, res: Response) => {
    try {
        const { search = '', status = '', page = '1', limit = '10' } = req.query as Record<string, string>;

        const pageNum = Math.max(1, parseInt(page, 10));
        const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNum - 1) * pageSize;

        const where: any = {};

        if (status && ['NEW', 'CONTACTED', 'CONVERTED'].includes(status)) {
            where.status = status;
        }

        if (search.trim()) {
            where.OR = [
                { name: { contains: search.trim(), mode: 'insensitive' } },
                { email: { contains: search.trim(), mode: 'insensitive' } },
                { organization: { contains: search.trim(), mode: 'insensitive' } },
                { contactNumber: { contains: search.trim(), mode: 'insensitive' } },
            ];
        }

        const [inquiries, total] = await Promise.all([
            (prisma as any).inquiry.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
            }),
            (prisma as any).inquiry.count({ where }),
        ]);

        return res.json({
            data: inquiries,
            total,
            page: pageNum,
            limit: pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (error) {
        console.error('[Inquiry] List error:', error);
        return res.status(500).json({ error: 'Failed to fetch inquiries.' });
    }
};

// ── SUPERADMIN: Get Single Inquiry ───────────────────────────────────────────

export const getInquiryById = async (req: Request, res: Response) => {
    try {
        const inquiry = await (prisma as any).inquiry.findUnique({ where: { id: req.params.id } });
        if (!inquiry) return res.status(404).json({ error: 'Inquiry not found.' });
        return res.json(inquiry);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch inquiry.' });
    }
};

// ── SUPERADMIN: Update Status ─────────────────────────────────────────────────

export const updateInquiryStatus = async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        const actor = (req as any).user;
        const id = req.params.id as string;

        if (!['NEW', 'CONTACTED', 'CONVERTED'].includes(status)) {
            return res.status(400).json({ error: 'Status must be NEW, CONTACTED, or CONVERTED.' });
        }

        const inquiry = await (prisma as any).inquiry.update({
            where: { id },
            data: { status },
        });

        logAction({
            userId: actor?.id,
            action: 'UPDATE_INQUIRY_STATUS',
            entityType: 'INQUIRY',
            entityId: id,
            changes: { status },
            status: 'SUCCESS',
        });

        return res.json(inquiry);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to update inquiry status.' });
    }
};

// ── SUPERADMIN: Delete Inquiry ────────────────────────────────────────────────

export const deleteInquiry = async (req: Request, res: Response) => {
    try {
        const actor = (req as any).user;
        const id = req.params.id as string;
        await (prisma as any).inquiry.delete({ where: { id } });

        logAction({
            userId: actor?.id,
            action: 'DELETE_INQUIRY',
            entityType: 'INQUIRY',
            entityId: id,
            status: 'SUCCESS',
        });

        return res.status(204).send();
    } catch (error) {
        console.error('[Inquiry] Delete error:', error);
        return res.status(500).json({ error: 'Failed to delete inquiry.' });
    }
};

// ── SUPERADMIN: Export All to Excel ──────────────────────────────────────────

export const exportInquiriesExcel = async (req: Request, res: Response) => {
    try {
        const inquiries = await (prisma as any).inquiry.findMany({
            orderBy: { createdAt: 'desc' },
        });

        const wb = new ExcelJS.Workbook();
        wb.creator = 'Zembaa AI System';
        wb.created = new Date();

        const ws = wb.addWorksheet('Inquiries');
        ws.columns = [
            { header: 'ID', key: 'id', width: 38 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Contact', key: 'contactNumber', width: 18 },
            { header: 'Organization', key: 'organization', width: 30 },
            { header: 'Message', key: 'message', width: 50 },
            { header: 'Status', key: 'status', width: 14 },
            { header: 'IP Address', key: 'ipAddress', width: 18 },
            { header: 'Date', key: 'createdAt', width: 26 },
        ];

        // Style header
        const headerRow = ws.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 24;

        // Add data rows
        inquiries.forEach((inq: any) => {
            ws.addRow({
                id: inq.id,
                name: inq.name,
                email: inq.email,
                contactNumber: inq.contactNumber,
                organization: inq.organization || '',
                message: inq.message || '',
                status: inq.status,
                ipAddress: inq.ipAddress || '',
                createdAt: inq.createdAt.toISOString(),
            });
        });

        // Alternating row colours
        ws.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: rowNumber % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF' },
                };
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="inquiries-${Date.now()}.xlsx"`);

        await wb.xlsx.write(res);
        return res.end();
    } catch (error) {
        console.error('[Inquiry] Export error:', error);
        return res.status(500).json({ error: 'Failed to export inquiries.' });
    }
};
