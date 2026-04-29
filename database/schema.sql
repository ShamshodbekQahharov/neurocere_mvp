-- ============================================================
-- NeuroCare Database Schema
-- ============================================================
-- PostgreSQL database for NeuroCare MVP platform
-- Tables: users, children, doctors, parents, reports,
--         sessions, messages, game_sessions, games,
--         notifications, ai_analyses
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid";

-- ============================================================
-- Table: users
-- All system users (doctors, parents, children, admins)
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('doctor', 'parent', 'child', 'admin', 'super_admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE users IS 'Main users table for all system roles';
COMMENT ON COLUMN users.id IS 'Unique UUID identifier';
COMMENT ON COLUMN users.role IS 'User role determining access permissions';

-- ============================================================
-- Table: children
-- Child patient profiles managed by doctors
-- ============================================================
CREATE TABLE children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    diagnosis TEXT NOT NULL,
    icd_code VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE children ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE children IS 'Child patient profiles with diagnosis information';
COMMENT ON COLUMN children.doctor_id IS 'Reference to the doctor managing this child';
COMMENT ON COLUMN children.icd_code IS 'International Classification of Diseases code';

-- ============================================================
-- Table: doctors
-- Doctor profile details
-- ============================================================
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specialization VARCHAR(255),
    clinic VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE doctors IS 'Doctor profile information';
COMMENT ON COLUMN doctors.user_id IS 'Reference to users table';

-- ============================================================
-- Table: parents
-- Parent profiles linked to their children
-- ============================================================
CREATE TABLE parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE SET NULL,
    phone VARCHAR(50),
    relation VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE parents ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE parents IS 'Parent profile information';
COMMENT ON COLUMN parents.child_id IS 'Reference to their child';

-- ============================================================
-- Table: reports
-- Daily reports from parents about child progress
-- ============================================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
    speech_notes TEXT,
    behavior_notes TEXT,
    sleep_hours DECIMAL(4,1),
    appetite INTEGER CHECK (appetite >= 1 AND appetite <= 10),
    tasks_completed INTEGER DEFAULT 0,
    ai_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE reports IS 'Daily progress reports from parents';
COMMENT ON COLUMN reports.mood_score IS '1-10 mood rating';
COMMENT ON COLUMN reports.ai_summary IS 'AI-generated summary of the report';

-- ============================================================
-- Table: sessions
-- Therapy sessions scheduled by doctors
-- ============================================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE sessions IS 'Therapy and consultation sessions';
COMMENT ON COLUMN sessions.status IS 'Current status of the session';

-- ============================================================
-- Table: messages
-- Chat messages between parents, doctors, and system
-- ============================================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE messages IS 'Chat messages between users';
COMMENT ON COLUMN messages.child_id IS 'Related child (if applicable)';

-- ============================================================
-- Table: game_sessions
-- Results from child gameplay sessions
-- ============================================================
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    game_id UUID NOT NULL,
    score INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    difficulty_level INTEGER DEFAULT 1,
    ai_adjustment JSONB,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE game_sessions IS 'Game play results and statistics';
COMMENT ON COLUMN game_sessions.ai_adjustment IS 'AI recommendations for difficulty adjustment';

-- ============================================================
-- Table: games
-- Catalog of available therapeutic games
-- ============================================================
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    min_age INTEGER,
    max_age INTEGER,
    difficulty_range VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE games IS 'Catalog of therapeutic games';
COMMENT ON COLUMN games.category IS 'Game category (e.g., memory, coordination, speech)'; 

-- ============================================================
-- Table: notifications
-- System notifications for users
-- ============================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE notifications IS 'System notifications for users';
COMMENT ON COLUMN notifications.type IS 'Notification category';

-- ============================================================
-- Table: ai_analyses
-- AI-generated analysis results
-- ============================================================
CREATE TABLE ai_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    analysis_type VARCHAR(100) NOT NULL,
    input_data JSONB NOT NULL,
    result TEXT NOT NULL,
    confidence DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE ai_analyses IS 'AI analysis results and predictions';
COMMENT ON COLUMN ai_analyses.confidence IS 'AI confidence score (0-1)';

-- ============================================================
-- Indexes for performance optimization
-- ============================================================

CREATE INDEX idx_children_doctor_id ON children(doctor_id);
CREATE INDEX idx_reports_child_id ON reports(child_id);
CREATE INDEX idx_reports_parent_id ON reports(parent_id);
CREATE INDEX idx_sessions_child_id ON sessions(child_id);
CREATE INDEX idx_sessions_doctor_id ON sessions(doctor_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_game_sessions_child_id ON game_sessions(child_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_ai_analyses_child_id ON ai_analyses(child_id);

-- ============================================================
-- End of Schema
-- ============================================================