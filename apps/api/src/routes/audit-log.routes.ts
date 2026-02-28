import { Router } from 'express';
import { getAuditLogs, exportAuditLogs } from '../controllers/audit-log.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Only Super Admins can see system-wide logs
router.use(authenticate);
router.use(requireRole(['SUPERADMIN']));

router.get('/', getAuditLogs);
router.get('/export', exportAuditLogs);

export default router;
