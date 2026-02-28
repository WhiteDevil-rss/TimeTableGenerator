import { Router } from 'express';
import { getPrograms, getProgramById, createProgram, updateProgram, deleteProgram } from '../controllers/program.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(requireRole(['SUPERADMIN', 'UNI_ADMIN', 'DEPT_ADMIN']));

router.get('/', getPrograms);
router.get('/:id', getProgramById);
router.post('/', createProgram);
router.put('/:id', updateProgram);
router.delete('/:id', deleteProgram);

export default router;
