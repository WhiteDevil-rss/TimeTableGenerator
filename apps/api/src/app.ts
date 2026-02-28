import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
import userRoutes from './routes/user.routes';
import programRoutes from './routes/program.routes';
import { createServer } from 'http';
import { socketService } from './services/socket.service';
import { checkAiHealth } from './services/ai.service';

import { auditLogger } from './middleware/audit-logger.middleware';

const app = express();
const port = process.env.PORT || 8000;

app.use(helmet());
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

app.use('/v1/auth', authRoutes);
app.use('/v1/universities/:universityId/departments', departmentRoutes);
app.use('/v1/universities', universityRoutes);
app.use('/v1/departments/:departmentId/timetables', timetableRoutes);
app.use('/v1/departments', departmentRoutes);
app.use('/v1/faculty', facultyRoutes);
app.use('/v1/courses', courseRoutes);
app.use('/v1/resources', resourceRoutes);
app.use('/v1/batches', batchRoutes);
app.use('/v1/users', userRoutes);
app.use('/v1/programs', programRoutes);
app.use('/v1/logs', auditLogRoutes);

const server = createServer(app);
socketService.initialize(server);

server.listen(port, () => {
    console.log(`API Server running on port ${port}`);
});
