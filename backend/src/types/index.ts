// TypeScript Type Definitions for NeuroCare Platform

// User Roles available in the system
export type UserRole = 'doctor' | 'parent' | 'child' | 'admin' | 'super_admin';

// User Interface - represents a system user
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

// Child Interface - represents a child patient profile
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

// Report Interface - represents daily reports from parents
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

// Generic API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Extended Request with authenticated user
export interface AuthenticatedRequest extends Express.Request {
  user: User;
}

// JWT Payload Type
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Request Body Types
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

// Auth Request (with typed user)
export type AuthRequest = AuthenticatedRequest;

// Child Interface - represents a child patient profile
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

// Report Interface - represents daily reports from parents
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

// Generic API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Extended Request with authenticated user
export interface AuthenticatedRequest extends Express.Request {
  user: User;
}

// JWT Payload Type
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Request Body Types
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