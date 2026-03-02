import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { ScheduleConfig } from '@nep-scheduler/types';
import { generateRequestSchema } from '@nep-scheduler/validation';
import authRoutes from './routes/auth.routes';
import universityRoutes from './routes/university.routes';
import departmentRoutes from './routes/department.routes';
import facultyRoutes from './routes/faculty.routes';
import courseRoutes from './routes/course.routes';
import resourceRoutes from './routes/resource.routes';
import batchRoutes from './routes/batch.routes';
import timetableRoutes from './routes/timetable.routes';
import electiveRoutes from './routes/elective.routes';
import userRoutes from './routes/user.routes';
import programRoutes from './routes/program.routes';
import { createServer } from 'http';
import { socketService } from './services/socket.service';
import { checkAiHealth } from './services/ai.service';

import { auditLogger } from './middleware/audit-logger.middleware';

const app = express();
const port = process.env.PORT || 8000;

app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(auditLogger);

app.get('/health', (req: express.Request, res: express.Response) => {
    res.json({ status: 'ok', service: 'nepscheduler-api' });
});

app.get('/v1/ai-health', async (req: express.Request, res: express.Response) => {
    const health = await checkAiHealth();
    res.json(health);
});

import auditLogRoutes from './routes/audit-log.routes';
import settingsRoutes from './routes/settings.routes';
import firebaseSyncRoutes from './routes/firebase-sync.routes';
import seedManagementRoutes from './routes/seed-management.routes';
import inquiryRoutes from './routes/inquiry.routes';

app.use('/v1/auth', authRoutes);
app.use('/v1/universities/:universityId/departments', departmentRoutes);
app.use('/v1/universities', universityRoutes);
app.use('/v1/departments/:departmentId/timetables', timetableRoutes);
app.use('/v1/departments/:departmentId/electives', electiveRoutes);
app.use('/v1/departments', departmentRoutes);
app.use('/v1/faculty', facultyRoutes);
app.use('/v1/courses', courseRoutes);
app.use('/v1/resources', resourceRoutes);
app.use('/v1/batches', batchRoutes);
app.use('/v1/users', userRoutes);
app.use('/v1/programs', programRoutes);
app.use('/v1/logs', auditLogRoutes);
app.use('/v1/settings', settingsRoutes);
app.use('/v1/firebase-sync', firebaseSyncRoutes);
app.use('/v1/seed', seedManagementRoutes);
app.use('/v1/inquiries', inquiryRoutes);

const server = createServer(app);
socketService.initialize(server);

server.listen(port, () => {
    console.log(`API Server running on port ${port}`);
});
