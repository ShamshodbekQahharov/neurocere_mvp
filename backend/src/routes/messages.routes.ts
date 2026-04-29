import { Router } from 'express';
import {
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
} from '../controllers/messages.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.get('/', authenticate, getMessages);
router.post('/', authenticate, sendMessage);
router.put('/:id/read', authenticate, markAsRead);
router.get('/unread-count', authenticate, getUnreadCount);

export default router;