-- ====================================================================
-- TestMakon - PostgreSQL & Supabase Database Migration & Security Schema
-- Production Schema for 500+ Concurrent Students
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');
CREATE TYPE question_type AS ENUM ('SINGLE', 'TRUE_FALSE');
CREATE TYPE attempt_status AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED', 'RESET');

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    role user_role DEFAULT 'STUDENT' NOT NULL,
    telegram_user_id BIGINT UNIQUE,
    telegram_username VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. GROUPS TABLE
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. GROUP MEMBERS
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(group_id, student_id)
);

-- 6. TESTS TABLE
CREATE TABLE IF NOT EXISTS tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    book_source VARCHAR(255),
    topic VARCHAR(255),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    time_limit_minutes INT DEFAULT 30 NOT NULL,
    attempt_limit INT DEFAULT 1 NOT NULL, -- 0 for unlimited
    passing_percentage INT DEFAULT 60 NOT NULL,
    opening_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    closing_time TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days') NOT NULL,
    randomize_questions BOOLEAN DEFAULT FALSE NOT NULL,
    randomize_options BOOLEAN DEFAULT FALSE NOT NULL,
    show_correct_answers BOOLEAN DEFAULT TRUE NOT NULL,
    show_explanations BOOLEAN DEFAULT TRUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type question_type DEFAULT 'SINGLE' NOT NULL,
    points NUMERIC(5,2) DEFAULT 1.0 NOT NULL,
    explanation TEXT,
    order_num INT DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. QUESTION OPTIONS TABLE
CREATE TABLE IF NOT EXISTS question_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_letter VARCHAR(10) NOT NULL, -- 'A', 'B', 'C', 'D' or 'TRUE', 'FALSE'
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE NOT NULL,
    order_num INT DEFAULT 1 NOT NULL
);

-- 9. TEST ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS test_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ,
    status attempt_status DEFAULT 'IN_PROGRESS' NOT NULL,
    tab_exits_count INT DEFAULT 0 NOT NULL,
    current_answers_json JSONB DEFAULT '{}'::jsonb NOT NULL,
    last_saved_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. ATTEMPT ANSWERS TABLE
CREATE TABLE IF NOT EXISTS attempt_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_option VARCHAR(10),
    is_correct BOOLEAN DEFAULT FALSE NOT NULL,
    earned_points NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
    answered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(attempt_id, question_id)
);

-- 11. TEST RESULTS TABLE
CREATE TABLE IF NOT EXISTS test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID UNIQUE NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    total_questions INT NOT NULL,
    correct_answers INT NOT NULL,
    incorrect_answers INT NOT NULL,
    total_points NUMERIC(7,2) NOT NULL,
    earned_points NUMERIC(7,2) NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    is_passed BOOLEAN NOT NULL,
    time_spent_seconds INT NOT NULL,
    tab_exits_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. TAB EXIT EVENTS
CREATE TABLE IF NOT EXISTS tab_exit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
    event_type VARCHAR(50) DEFAULT 'visibility_hidden' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 13. TELEGRAM VERIFICATION CODES
CREATE TABLE IF NOT EXISTS verification_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) NOT NULL,
    code_hash TEXT NOT NULL,
    telegram_user_id BIGINT,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT FALSE NOT NULL,
    attempts_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 14. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_name VARCHAR(150),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id VARCHAR(100),
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 15. RETAKE AUTHORIZATIONS
CREATE TABLE IF NOT EXISTS retake_authorizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    authorized_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ====================================================================
-- PERFORMANCE INDEXES (Optimized for 500+ Concurrent Students)
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_group_members_student ON group_members(student_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_tests_group_active ON tests(group_id, is_active);
CREATE INDEX IF NOT EXISTS idx_questions_test_order ON questions(test_id, order_num);
CREATE INDEX IF NOT EXISTS idx_question_options_q_correct ON question_options(question_id, is_correct);
CREATE INDEX IF NOT EXISTS idx_attempts_student_test ON test_attempts(student_id, test_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status_expires ON test_attempts(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_results_student ON test_results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_test ON test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_results_created ON test_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_phone ON verification_codes(phone, is_used, expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Students read themselves, Teachers/Admins read all students
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT USING (auth.uid()::text = user_id OR EXISTS (
        SELECT 1 FROM profiles p WHERE p.user_id = auth.uid()::text AND p.role IN ('TEACHER', 'ADMIN')
    ));

-- Groups: Students read their groups, Teachers read assigned groups, Admins read all
CREATE POLICY "Group membership read access" ON groups
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid()::text AND role = 'ADMIN') OR
        teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()::text) OR
        id IN (SELECT group_id FROM group_members gm JOIN profiles p ON gm.student_id = p.id WHERE p.user_id = auth.uid()::text)
    );

-- Tests: Students can view active tests assigned to their groups
CREATE POLICY "Test view policy" ON tests
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid()::text AND role = 'ADMIN') OR
        teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()::text) OR
        (is_active = TRUE AND group_id IN (
            SELECT group_id FROM group_members gm JOIN profiles p ON gm.student_id = p.id WHERE p.user_id = auth.uid()::text
        ))
    );

-- Test Results: Students read only their results, Teachers/Admin read their students'
CREATE POLICY "Test results policy" ON test_results
    FOR SELECT USING (
        student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()::text) OR
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid()::text AND role IN ('TEACHER', 'ADMIN'))
    );
