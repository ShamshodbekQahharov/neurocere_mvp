import { Router } from 'express';
import {
  getNotifications,
  markNotificationRead,
} from '../controllers/notifications.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.get('/', authenticate, getNotifications);
router.put('/:id/read', authenticate, markNotificationRead);

export default router;