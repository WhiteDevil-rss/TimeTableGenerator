import { Router } from 'express';
import { getResources, getResourceById, createResource, updateResource, deleteResource } from '../controllers/resource.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
// Department Admins also need read access to resources for special TT
router.get('/', getResources);
router.get('/:id', getResourceById);

// Only Super Admin, Uni Admin, and Dept Admin can modify resources
router.post('/', requireRole(['SUPERADMIN', 'UNI_ADMIN', 'DEPT_ADMIN']), createResource);
router.put('/:id', requireRole(['SUPERADMIN', 'UNI_ADMIN', 'DEPT_ADMIN']), updateResource);
router.delete('/:id', requireRole(['SUPERADMIN', 'UNI_ADMIN', 'DEPT_ADMIN']), deleteResource);


export default router;
