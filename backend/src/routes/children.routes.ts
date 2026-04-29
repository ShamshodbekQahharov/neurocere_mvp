import { Router } from 'express';
import {
  createChild,
  getAllChildren,
  getChildById,
  updateChild,
  deleteChild,
  getChildProgress,
} from '../controllers/children.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// Public routes (none for children)

// Protected routes
router.route('/')
  .get(authenticate, getAllChildren)
  .post(authenticate, authorizeRole('doctor'), createChild);

router.route('/:id')
  .get(authenticate, getChildById)
  .put(authenticate, authorizeRole('doctor'), updateChild)
  .delete(authenticate, authorizeRole('doctor'), deleteChild);

router.get(
  '/:id/progress',
  authenticate,
  getChildProgress
);

export default router;