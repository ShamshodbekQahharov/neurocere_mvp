import { Router } from 'express';
import {
  createReport,
  getReportsByChild,
  getReportById,
  getReportStats,
  getAllReports,
} from '../controllers/reports.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// Public routes (none for reports)

// Protected routes
router.post(
  '/',
  authenticate,
  authorizeRole('parent'),
  createReport
);

router.get(
  '/',
  authenticate,
  authorizeRole('doctor'),
  getAllReports
);

router.get(
  '/child/:childId',
  authenticate,
  getReportsByChild
);

router.get(
  '/child/:childId/stats',
  authenticate,
  getReportStats
);

router.get(
  '/:id',
  authenticate,
  getReportById
);

export default router;