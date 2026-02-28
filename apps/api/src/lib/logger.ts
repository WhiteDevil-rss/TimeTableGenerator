import winston from 'winston';
import 'winston-daily-rotate-file';
import prisma from './prisma';
import path from 'path';

// ── Winston File Logger Setup ────────────────────────────────────────────────
const fileTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
});

const consoleTransport = new winston.transports.Console({
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
    ),
});

export const winstonLogger = winston.createLogger({
    level: 'info',
    transports: [fileTransport, consoleTransport],
});

// ── Enterprise Log Interface ──────────────────────────────────────────────────
export interface LogParams {
    userId?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    changes?: any;
    status: 'SUCCESS' | 'FAILURE';
    endpoint?: string;
    method?: string;
    durationMs?: number;
    ipAddress?: string;
    userAgent?: string;
    errorMessage?: string;
}

/**
 * Enterprise Logger: Writes to both winston (files) and Prisma (database)
 */
export async function logAction(params: LogParams) {
    try {
        // 1. Log to Database
        await (prisma.auditLog.create as any)({
            data: {
                userId: params.userId,
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId,
                changes: params.changes || {},
                status: params.status,
                endpoint: params.endpoint,
                method: params.method,
                durationMs: params.durationMs,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
            }
        });

        // 2. Log to File
        const logLevel = params.status === 'SUCCESS' ? 'info' : 'error';
        winstonLogger.log(logLevel, params.action, {
            ...params,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        // Fallback if DB logging fails
        console.error('CRITICAL: Audit logging to database failed!', error);
        winstonLogger.error('Audit logging failed', { error, originalParams: params });
    }
}
