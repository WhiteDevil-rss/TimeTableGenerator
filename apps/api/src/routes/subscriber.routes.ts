import { Router } from 'express';
import {
    subscribe,
    getSubscribers,
    getSubscribersStats,
    updateSubscriberStatus,
    deleteSubscriber,
    exportSubscribers
} from '../controllers/subscriber.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Public endpoint
router.post('/', subscribe);

// Admin-only endpoints
router.use(authenticate);
router.use(requireRole(['SUPERADMIN']));

router.get('/export', exportSubscribers);
router.get('/stats', getSubscribersStats);
router.get('/', getSubscribers);
router.patch('/:id/status', updateSubscriberStatus);
router.delete('/:id', deleteSubscriber);

export default router;
