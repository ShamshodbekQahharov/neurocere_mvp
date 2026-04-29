import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for AI endpoints
 * More strict because AI API calls are expensive
 */
export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Juda ko\'p so\'rov. 1 daqiqa kuting.',
  },
  skipSuccessfulRequests: false,
});

/**
 * General rate limiter for all other endpoints
 */
export const generalRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Juda ko\'p so\'rov. Biroz kuting.',
  },
  skipSuccessfulRequests: false,
});