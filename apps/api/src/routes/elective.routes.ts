import { Router } from 'express';
import {
    listElectiveBaskets,
    createElectiveBasket,
    updateElectiveBasket,
    deleteElectiveBasket,
} from '../controllers/elective.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });

router.use(authenticate);

// All routes scoped under /departments/:deptId/electives
router.get('/', requireRole(['DEPT_ADMIN', 'SUPERADMIN', 'UNI_ADMIN']), listElectiveBaskets);
router.post('/', requireRole(['DEPT_ADMIN']), createElectiveBasket);
router.put('/:id', requireRole(['DEPT_ADMIN']), updateElectiveBasket);
router.delete('/:id', requireRole(['DEPT_ADMIN']), deleteElectiveBasket);

export default router;
