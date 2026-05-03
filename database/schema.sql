-- ============================================================
-- NeuroCare Database Schema
-- PostgreSQL with Supabase
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid";

-- ============================================================
-- 1. USERS (Supabase auth bilan bog'liq)
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL 
        CHECK (role IN ('doctor','parent','child','admin','super_admin')),
    avatar_url TEXT,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- 2. CHILDREN (bola profili)
-- ============================================================
CREATE TABLE children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    diagnosis TEXT NOT NULL,
    icd_code VARCHAR(50),
    notes TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- RLS Policies for children
CREATE POLICY "Doctors can view their own children" ON children
    FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert their own children" ON children
    FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their own children" ON children
    FOR UPDATE USING (auth.uid() = doctor_id);

CREATE POLICY "Parents can view their children" ON children
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM parents WHERE child_id = id));

-- ============================================================
-- 3. DOCTORS (doktor profili)
-- ============================================================
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specialization VARCHAR(255),
    clinic VARCHAR(255),
    phone VARCHAR(50),
    license_number VARCHAR(100),
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doctors
CREATE POLICY "Doctors can view own profile" ON doctors
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Doctors can update own profile" ON doctors
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all doctors" ON doctors
    FOR SELECT USING (
        (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'super_admin')
    );

-- ============================================================
-- 4. PARENTS (ota-ona profili)
-- ============================================================
CREATE TABLE parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    phone VARCHAR(50),
    relation VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE parents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parents
CREATE POLICY "Parents can view own profile" ON parents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Parents can update own profile" ON parents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Doctors can view parents of their children" ON parents
    FOR SELECT USING (
        auth.uid() IN (
            SELECT doctor_id FROM children WHERE id = child_id
        )
    );

-- ============================================================
-- 5. REPORTS (kunlik hisobotlar)
-- ============================================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
     mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
     speech_notes TEXT,
     behavior_notes TEXT,
     sleep_hours DECIMAL(4,1) CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
     appetite TEXT CHECK (appetite IN ('poor', 'fair', 'good', 'excellent')),
     tasks_completed INTEGER DEFAULT 0,
    ai_summary TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports
CREATE POLICY "Parents can view own reports" ON reports
    FOR SELECT USING (auth.uid() = (SELECT user_id FROM parents WHERE id = parent_id));

CREATE POLICY "Parents can create own reports" ON reports
    FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM parents WHERE id = parent_id));

CREATE POLICY "Parents can update own reports" ON reports
    FOR UPDATE USING (auth.uid() = (SELECT user_id FROM parents WHERE id = parent_id));

CREATE POLICY "Doctors can view reports of their children" ON reports
    FOR SELECT USING (
        auth.uid() IN (
            SELECT doctor_id FROM children WHERE id = child_id
        )
    );

-- ============================================================
-- 6. SESSIONS (terapiya sessiyalari)
-- ============================================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    status VARCHAR(50) DEFAULT 'scheduled' 
        CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sessions
CREATE POLICY "Doctors can view their sessions" ON sessions
    FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can create sessions" ON sessions
    FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their sessions" ON sessions
    FOR UPDATE USING (auth.uid() = doctor_id);

CREATE POLICY "Parents can view their children sessions" ON sessions
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM parents WHERE child_id = child_id
        )
    );

-- ============================================================
-- 7. MESSAGES (chat xabarlari)
-- ============================================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view their messages" ON messages
    FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their messages" ON messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- ============================================================
-- 8. GAMES (o'yinlar katalogi)
-- ============================================================
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    min_age INTEGER CHECK (min_age >= 0),
    max_age INTEGER CHECK (max_age >= 0),
    difficulty_range VARCHAR(50),
    description TEXT,
    thumbnail_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- RLS Policies for games
CREATE POLICY "Everyone can view active games" ON games
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage games" ON games
    FOR ALL USING (
        (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'super_admin')
    );

-- ============================================================
-- 9. GAME_SESSIONS (o'yin natijalari)
-- ============================================================
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0),
    correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0),
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1),
    ai_adjustment JSONB,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_time CHECK (ended_at > started_at)
);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_sessions
CREATE POLICY "Children can view their game sessions" ON game_sessions
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM parents WHERE child_id = child_id
        )
    );

CREATE POLICY "Insert game sessions" ON game_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Doctors can view game sessions of their children" ON game_sessions
    FOR SELECT USING (
        auth.uid() IN (
            SELECT doctor_id FROM children WHERE id = child_id
        )
    );

-- ============================================================
-- 10. AI_ANALYSES (AI tahlil natijalari)
-- ============================================================
CREATE TABLE ai_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    analysis_type VARCHAR(100) NOT NULL,
    input_data JSONB NOT NULL,
    result TEXT NOT NULL,
    confidence DECIMAL(5,4) CHECK (confidence >= 0 AND confidence <= 1),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_analyses
CREATE POLICY "Users can view AI analyses for their children" ON ai_analyses
    FOR SELECT USING (
        child_id IN (
            SELECT id FROM children WHERE doctor_id = auth.uid()
            UNION
            SELECT child_id FROM parents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can create AI analyses" ON ai_analyses
    FOR INSERT WITH CHECK (true);

-- ============================================================
-- 11. NOTIFICATIONS (bildirishnomalar)
-- ============================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- ============================================================
-- INDEXES (Tez ishlash uchun)
-- ============================================================
CREATE INDEX idx_children_doctor_id ON children(doctor_id);
CREATE INDEX idx_reports_child_id ON reports(child_id);
CREATE INDEX idx_reports_parent_id ON reports(parent_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_game_sessions_child_id ON game_sessions(child_id);
CREATE INDEX idx_game_sessions_game_id ON game_sessions(game_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_ai_analyses_child_id ON ai_analyses(child_id);
CREATE INDEX idx_sessions_child_id ON sessions(child_id);
CREATE INDEX idx_sessions_doctor_id ON sessions(doctor_id);

-- ============================================================
-- Updated at trigger (optional)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT quote_ident(tablename)
        FROM pg_tables
        WHERE schemaname = 'public' 
        AND tablename IN ('users','children','doctors','parents','reports',
                           'sessions','messages','games','game_sessions',
                           'ai_analyses','notifications')
    LOOP
        EXECUTE format(
            'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %s
             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
            table_name
        );
    END LOOP;
END$$;
