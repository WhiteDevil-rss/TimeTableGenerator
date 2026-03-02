import { Router } from 'express';
import {
    createInquiry,
    getAllInquiries,
    getInquiryById,
    updateInquiryStatus,
    deleteInquiry,
    exportInquiriesExcel,
} from '../controllers/inquiry.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// ── Public route (no auth required) ─────────────────────────────────────────
router.post('/', createInquiry);

// ── Super Admin only routes ──────────────────────────────────────────────────
router.use(authenticate);
router.use(requireRole(['SUPERADMIN']));

router.get('/export', exportInquiriesExcel);
router.get('/', getAllInquiries);
router.get('/:id', getInquiryById);
router.patch('/:id/status', updateInquiryStatus);
router.delete('/:id', deleteInquiry);

export default router;
