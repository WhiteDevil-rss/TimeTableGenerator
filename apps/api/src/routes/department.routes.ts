import { Router } from 'express';
import { getDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment } from '../controllers/department.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });

// Universities and SUPERADMIN can manage departments, but anyone in the university can view them
router.use(authenticate);

// These routes assume they are mounted on /universities/:universityId/departments
router.get('/', requireRole(['SUPERADMIN', 'UNI_ADMIN', 'DEPT_ADMIN', 'FACULTY']), getDepartments);
router.get('/:id', requireRole(['SUPERADMIN', 'UNI_ADMIN', 'DEPT_ADMIN', 'FACULTY']), getDepartmentById);
router.post('/', requireRole(['SUPERADMIN', 'UNI_ADMIN']), createDepartment);
router.put('/:id', requireRole(['SUPERADMIN', 'UNI_ADMIN']), updateDepartment);
router.delete('/:id', requireRole(['SUPERADMIN', 'UNI_ADMIN']), deleteDepartment);

export default router;
