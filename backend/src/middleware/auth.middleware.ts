import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { supabaseClient } from '../config/supabase';
import { User } from '../types';

// JWT Secret from environment
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;

    // Check if token exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Token topilmadi',
      });
      return;
    }

    // Extract token from "Bearer TOKEN" format
    const token = authHeader.split(' ')[1];

    // Verify JWT token
    let decoded: string | JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      res.status(401).json({
        success: false,
        error: 'Token yaroqsiz',
      });
      return;
    }

    // Check if token is expired
    const payload = decoded as JwtPayload;
    if (payload.exp && payload.exp < Date.now() / 1000) {
      res.status(401).json({
        success: false,
        error: 'Token muddati tugagan',
      });
      return;
    }

    // Get user from Supabase using userId from token
    const { data: userData, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .single();

    if (error || !userData) {
      res.status(401).json({
        success: false,
        error: 'Foydalanuvchi topilmadi',
      });
      return;
    }

    // Attach user to request object
    (req as any).user = userData as User;

    // Continue to next middleware
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

/**
 * Authorization Middleware
 * Checks if user has required role(s)
 */
export const authorizeRole = (...roles: string[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = (req as any).user as User;

      // Check if user role is in allowed roles
      if (!user || !roles.includes(user.role)) {
        res.status(403).json({
          success: false,
          error: 'Ruxsat yo\'q',
        });
        return;
      }

      // User is authorized
      next();
    } catch (error) {
      console.error('Authorization middleware error:', error);
      res.status(403).json({
        success: false,
        error: 'Authorization failed',
      });
    }
  };
};