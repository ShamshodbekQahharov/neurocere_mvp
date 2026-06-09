// TypeScript Type Definitions for NeuroCare Platform

import { Request } from 'express'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: string
        full_name: string
      }
    }
  }
}

export {}

export type UserRole = 'doctor' | 'parent' | 'child' | 'admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  is_active?: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Child {
  id: string;
  doctor_id: string;
  full_name: string;
  birth_date: Date;
  diagnosis: string;
  icd_code: string;
  notes: string;
  avatar_url?: string;
  is_active?: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Report {
  id: string;
  child_id: string;
  parent_id: string;
  report_date: Date;
  mood_score: number;
  speech_notes: string;
  behavior_notes: string;
  sleep_hours: number;
  appetite: number;
  tasks_completed: number;
  ai_summary: string | null;
  is_active?: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthenticatedRequest extends Request {
  user: User;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface RegisterBody {
  email: string;
  password: string;
  full_name: string;
  role: 'doctor' | 'parent';
}

export interface LoginBody {
  email: string;
  password: string;
}

export type AuthRequest = AuthenticatedRequest;
