import { Request, Response, NextFunction } from 'express';
import { logAction } from '../lib/logger';

/**
 * Middleware to track request duration and log the final outcome
 */
export const auditLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const actor = (req as any).user;

    // Hook into response finish to capture status and duration
    res.on('finish', () => {
        const durationMs = Date.now() - start;
        const status = res.statusCode >= 400 ? 'FAILURE' : 'SUCCESS';

        // We only log non-GET requests for the audit trail to avoid bloat
        // UNLESS it's specifically requested or looks like a login attempt
        if (req.method !== 'GET' || req.path.includes('login') || req.path.includes('auth')) {
            logAction({
                userId: actor?.id,
                action: `${req.method} ${req.path}`,
                status: status,
                endpoint: req.originalUrl,
                method: req.method,
                durationMs: durationMs,
                ipAddress: req.ip || req.socket.remoteAddress,
                userAgent: req.get('user-agent'),
                // Note: We don't log passwords or sensitive data here for security
                changes: req.method !== 'GET' ? { body: filterSensitiveData(req.body) } : undefined
            }).catch(err => console.error('Audit logging error:', err));
        }
    });

    next();
};

function filterSensitiveData(body: any) {
    if (!body) return body;
    const filtered = { ...body };
    const sensitive = ['password', 'token', 'secret', 'adminPassword'];
    sensitive.forEach(key => {
        if (key in filtered) filtered[key] = '********';
    });
    return filtered;
}
