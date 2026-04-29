// TypeScript Type Definitions for NeuroCare Platform

// User Roles available in the system
export type UserRole = 'doctor' | 'parent' | 'child' | 'admin' | 'super_admin';

// User Interface - represents a system user
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: Date;
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
  created_at: Date;
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
  created_at: Date;
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