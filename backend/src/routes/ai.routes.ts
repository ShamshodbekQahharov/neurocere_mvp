import { Router } from 'express';
import {
  chatbotMessage,
  getAnalyses,
  adjustGameLevel,
} from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRole } from '../middleware/auth.middleware';
import { aiRateLimit } from '../middleware/rateLimit.middleware';

const router = Router();

// Rate limit for AI routes
router.use(aiRateLimit);

// Chatbot - parent only
router.post(
  '/chatbot',
  authenticate,
  authorizeRole('parent'),
  chatbotMessage
);

// AI analyses - doctor only
router.get(
  '/analyses',
  authenticate,
  authorizeRole('doctor'),
  getAnalyses
);

// Game difficulty adjustment
router.post(
  '/game-adjust',
  authenticate,
  adjustGameLevel
);

export default router;