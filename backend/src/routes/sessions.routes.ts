import { Router } from 'express';
import {
  createSession,
  getSessions,
  getSessionById,
  updateSession,
  getUpcomingSessions,
  getSessionStats,
} from '../controllers/sessions.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// Protected routes
router.post(
  '/',
  authenticate,
  authorizeRole('doctor'),
  createSession
);

router.get(
  '/upcoming',
  authenticate,
  getUpcomingSessions
);

router.get(
  '/stats/:childId',
  authenticate,
  authorizeRole('doctor'),
  getSessionStats
);

router.get(
  '/',
  authenticate,
  getSessions
);

router.get(
  '/:id',
  authenticate,
  getSessionById
);

router.put(
  '/:id',
  authenticate,
  authorizeRole('doctor'),
  updateSession
);

export default router;