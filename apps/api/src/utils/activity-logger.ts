import fs from 'fs';
import path from 'path';

// Resolve log file path relative to the API root
const LOG_FILE = path.join(process.cwd(), 'activity.log');

export interface LogEntry {
    timestamp: string;
    userId: string;
    role: string;
    action: string;
    details?: any;
}

/**
 * Logs an activity to a persistent file.
 * Survives application restarts as it writes to the local file system.
 */
export const logActivity = (
    userId: string,
    role: string,
    action: string,
    details?: any
) => {
    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        userId,
        role,
        action,
        details,
    };

    const logMessage = `${JSON.stringify(entry)}\n`;

    try {
        // Ensure file exists and append
        fs.appendFileSync(LOG_FILE, logMessage, 'utf8');
    } catch (err) {
        console.error('CRITICAL: Failed to write to activity.log:', err);
    }
};
