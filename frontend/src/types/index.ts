// TypeScript Type Definitions for NeuroCare Platform

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
  icd_code?: string;
  notes?: string;
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
  speech_notes?: string | null;
  behavior_notes?: string | null;
  sleep_hours?: number | null;
  appetite?: 'poor' | 'fair' | 'good' | 'excellent' | null;
  tasks_completed?: number | null;
  ai_summary?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  id: string;
  child_id: string;
  doctor_id: string;
  scheduled_at: Date;
  duration_minutes: number;
  session_type?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string | null;
  session_notes?: string | null;
  completed_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  child_id: string;
  content: string;
  is_read: boolean;
  created_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}