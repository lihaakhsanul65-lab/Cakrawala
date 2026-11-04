-- ============================================================================
-- CAKRAWALA LMS — ENTERPRISE DATABASE SCHEMA & MIGRATION SCRIPT (POSTGRESQL)
-- Versi: 4.5.0
-- Arsitektur: Multi-Role (Admin, Guru, Siswa), Single Active Session,
-- Safe Exam Browser (SEB) One-Time Exam Locks, AI Grading & Teacher Override,
-- Centralized Gradebook Synchronization, Digital Attendance & Global Notifications.
-- ============================================================================

-- Ekstensi PostgreSQL yang Dibutuhkan
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TABEL PENGGUNA TERPUSAT (USERS)
-- Menghubungkan seluruh peran Admin, Guru, dan Siswa ke skema terpadu
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'guru', 'siswa')),
    identifier_number VARCHAR(64), -- NIP untuk Guru/Admin, NISN untuk Siswa
    is_wali_kelas BOOLEAN DEFAULT FALSE,
    kelas_bimbingan VARCHAR(64), -- Misal '12-MIPA-1'
    institution VARCHAR(255) DEFAULT 'SMA Cakrawala Nusantara',
    phone VARCHAR(32),
    avatar_url TEXT,
    google_id VARCHAR(128) UNIQUE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- ----------------------------------------------------------------------------
-- 2. MANAJEMEN SESI TUNGGAL AKTIF (SINGLE ACTIVE SESSION / ANTI DUAL-LOGIN)
-- Memastikan pengguna hanya aktif pada 1 perangkat (Device A diakhiri saat Device B login)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(128) NOT NULL UNIQUE,
    device_id VARCHAR(128) NOT NULL,
    device_name VARCHAR(255),
    ip_address VARCHAR(45),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);

-- ----------------------------------------------------------------------------
-- 3. TABEL KURSUS, SILABUS & SEKSI MINGGUAN (COURSES & SYLLABUS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    teacher_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    teacher_name VARCHAR(255) NOT NULL,
    target_class VARCHAR(64) DEFAULT 'Semua',
    enrollment_key VARCHAR(128),
    banner_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id VARCHAR(64) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_course_student UNIQUE(course_id, student_id)
);

CREATE TABLE IF NOT EXISTS weekly_sections (
    id VARCHAR(64) PRIMARY KEY,
    course_id VARCHAR(64) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    week_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pengantar & Kontrak Pembelajaran (Syllabus & Intro Materials Uploads)
CREATE TABLE IF NOT EXISTS course_intro_materials (
    id VARCHAR(64) PRIMARY KEY,
    course_id VARCHAR(64) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    file_url TEXT,
    file_name VARCHAR(255),
    author_name VARCHAR(255) NOT NULL,
    author_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Materi / Aktivitas Mingguan
CREATE TABLE IF NOT EXISTS course_resources (
    id VARCHAR(64) PRIMARY KEY,
    section_id VARCHAR(64) NOT NULL REFERENCES weekly_sections(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('text', 'pdf', 'link', 'video')),
    content TEXT NOT NULL,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resource_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id VARCHAR(64) NOT NULL REFERENCES course_resources(id) ON DELETE CASCADE,
    student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_resource_student UNIQUE(resource_id, student_id)
);

-- ----------------------------------------------------------------------------
-- 4. PRESENSI DIGITAL MAHASISWA / SISWA (DIGITAL ATTENDANCE)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS digital_attendances (
    id VARCHAR(64) PRIMARY KEY,
    course_id VARCHAR(64) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    section_id VARCHAR(64) NOT NULL REFERENCES weekly_sections(id) ON DELETE CASCADE,
    student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    student_nis VARCHAR(64),
    attendance_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'hadir' CHECK (status IN ('hadir', 'izin', 'sakit', 'alpha')),
    device_info TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_course_section_student_date UNIQUE(course_id, section_id, student_id, attendance_date)
);

-- ----------------------------------------------------------------------------
-- 5. KUIS PEMBELAJARAN & EVALUASI GURU (DIRECT QUIZZES)
-- Mendukung input kunci jawaban guru, evaluasi AI, dan override skor manual guru
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS direct_quizzes (
    id VARCHAR(64) PRIMARY KEY,
    course_id VARCHAR(64) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    course_title VARCHAR(255) NOT NULL,
    target_class VARCHAR(64) DEFAULT 'Semua',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INT DEFAULT 20,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    teacher_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    teacher_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS direct_quiz_questions (
    id VARCHAR(64) PRIMARY KEY,
    quiz_id VARCHAR(64) NOT NULL REFERENCES direct_quizzes(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL CHECK (type IN ('mcq', 'true_false', 'short', 'numeric', 'essay')),
    prompt TEXT NOT NULL,
    points INT NOT NULL DEFAULT 20,
    options JSONB, -- Array string pilihan: ["Opsi A", "Opsi B", ...]
    correct_option_index INT, -- Kunci jawaban MCQ (0, 1, 2, ...)
    correct_boolean BOOLEAN, -- Kunci jawaban True/False
    expected_answer TEXT, -- Kunci jawaban rujukan isian / esai
    rubric_criteria TEXT, -- Panduan rubrik evaluasi AI
    question_order INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS direct_quiz_submissions (
    id VARCHAR(64) PRIMARY KEY,
    quiz_id VARCHAR(64) NOT NULL REFERENCES direct_quizzes(id) ON DELETE CASCADE,
    student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    student_class VARCHAR(64),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_score INT NOT NULL DEFAULT 0,
    max_score INT NOT NULL DEFAULT 100,
    status VARCHAR(32) DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed')),
    teacher_feedback TEXT,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS direct_quiz_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id VARCHAR(64) NOT NULL REFERENCES direct_quiz_submissions(id) ON DELETE CASCADE,
    question_id VARCHAR(64) NOT NULL REFERENCES direct_quiz_questions(id) ON DELETE CASCADE,
    selected_option_index INT,
    selected_boolean BOOLEAN,
    text_answer TEXT,
    numeric_answer NUMERIC,
    is_auto_graded BOOLEAN DEFAULT FALSE,
    ai_score INT DEFAULT 0,
    ai_feedback TEXT,
    teacher_score INT, -- Nilai override resmi guru
    teacher_notes TEXT,
    earned_points INT NOT NULL DEFAULT 0
);

-- ----------------------------------------------------------------------------
-- 6. UJIAN SAFE EXAM BROWSER (SEB), AI GRADING & ONE-TIME ATTEMPT LOCKS
-- Aturan pengerjaan SEB tepat 1x dengan kunci otomatis & antarmuka unlock guru/admin
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assignments (
    id VARCHAR(64) PRIMARY KEY,
    course_id VARCHAR(64) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    course_title VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    deadline TIMESTAMP WITH TIME ZONE,
    duration_minutes INT NOT NULL DEFAULT 30,
    is_seb_locked BOOLEAN DEFAULT TRUE,
    max_violations INT DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assignment_questions (
    id VARCHAR(64) PRIMARY KEY,
    assignment_id VARCHAR(64) NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL CHECK (type IN ('mcq', 'short', 'essay', 'image')),
    prompt TEXT NOT NULL,
    points INT NOT NULL DEFAULT 25,
    options JSONB,
    correct_option_index INT,
    expected_answer TEXT,
    rubric_criteria TEXT,
    question_order INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS submissions (
    id VARCHAR(64) PRIMARY KEY,
    assignment_id VARCHAR(64) NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    course_id VARCHAR(64) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) NOT NULL DEFAULT 'ai_graded_waiting_approval' CHECK (status IN ('ai_graded_waiting_approval', 'published')),
    total_ai_score INT NOT NULL DEFAULT 0,
    total_teacher_score INT, -- Nilai akhir terkalibrasi guru
    ai_overall_feedback TEXT,
    teacher_overall_feedback TEXT,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS submission_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id VARCHAR(64) NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    question_id VARCHAR(64) NOT NULL REFERENCES assignment_questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    selected_option_index INT,
    image_urls JSONB, -- Array foto bukti / lembar kerja bypass camera
    ai_score INT DEFAULT 0,
    ai_feedback TEXT,
    teacher_score INT, -- Nilai override per soal oleh guru
    teacher_feedback TEXT
);

CREATE TABLE IF NOT EXISTS seb_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id VARCHAR(64) NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    violation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    violation_type VARCHAR(32) NOT NULL CHECK (violation_type IN ('tab_switch', 'fullscreen_exit', 'blur_event')),
    description TEXT NOT NULL
);

-- Aturan Ujian SEB Sekali Pakai (One-Time SEB Exam Lock & Re-entry Unlock)
CREATE TABLE IF NOT EXISTS exam_locks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id VARCHAR(64) NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_id VARCHAR(64) REFERENCES submissions(id) ON DELETE SET NULL,
    is_locked BOOLEAN NOT NULL DEFAULT TRUE,
    locked_reason TEXT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    unlocked_by VARCHAR(255),
    unlocked_at TIMESTAMP WITH TIME ZONE,
    unlock_reason TEXT,
    CONSTRAINT uq_exam_lock_student UNIQUE(assignment_id, student_id)
);

-- ----------------------------------------------------------------------------
-- 7. MESIN NOTIFIKASI GLOBAL TERPUSAT (GLOBAL NOTIFICATION ENGINE)
-- Pengumuman langsung ke ikon lonceng untuk Semua, Grup Kelas, atau ID Siswa
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS global_notifications (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'alert')),
    target_type VARCHAR(20) DEFAULT 'all' CHECK (target_type IN ('all', 'class', 'user')),
    target_class VARCHAR(64),
    target_user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_role VARCHAR(20) NOT NULL,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id VARCHAR(64) NOT NULL REFERENCES global_notifications(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_notification_read UNIQUE(notification_id, user_id)
);

-- ----------------------------------------------------------------------------
-- 8. BUKU NILAI TERPADU & RAPOR WALI KELAS (GRADEBOOK & REPORT CARDS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_cards (
    id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    nisn VARCHAR(64) NOT NULL,
    kelas VARCHAR(64) NOT NULL,
    semester VARCHAR(20) NOT NULL CHECK (semester IN ('Ganjil', 'Genap')),
    academic_year VARCHAR(32) NOT NULL,
    wali_kelas_name VARCHAR(255) NOT NULL,
    average_score NUMERIC(5,2) DEFAULT 0,
    homeroom_notes TEXT,
    status_kenaikan VARCHAR(32) DEFAULT 'Naik Kelas',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS report_card_grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_card_id VARCHAR(64) NOT NULL REFERENCES report_cards(id) ON DELETE CASCADE,
    course_id VARCHAR(64) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    course_title VARCHAR(255) NOT NULL,
    score INT NOT NULL,
    letter_grade VARCHAR(2) NOT NULL,
    kkm INT DEFAULT 75,
    teacher_name VARCHAR(255) NOT NULL,
    attendance_percent INT DEFAULT 100,
    exam_integrity_score INT DEFAULT 100
);

-- ----------------------------------------------------------------------------
-- SEED DATA AWAL (ADMIN, GURU, SISWA & KONTRAK PEMBELAJARAN)
-- ----------------------------------------------------------------------------
INSERT INTO users (id, name, email, role, identifier_number, is_wali_kelas, kelas_bimbingan, institution, status)
VALUES
('usr-admin-01', 'Administrator Utama', 'admin@cakrawala.sch.id', 'admin', '197501012000031001', FALSE, NULL, 'SMA Cakrawala Nusantara', 'active'),
('usr-guru-01', 'Drs. Bambang Suryono, M.Pd', 'bambang@cakrawala.sch.id', 'guru', '198204122005011003', TRUE, '12-MIPA-1', 'SMA Cakrawala Nusantara', 'active'),
('usr-guru-02', 'Siti Rahmawati, S.Pd, M.Si', 'siti.rahmawati@cakrawala.sch.id', 'guru', '198807232010012006', FALSE, NULL, 'SMA Cakrawala Nusantara', 'active'),
('usr-siswa-01', 'Arya Pratama', 'arya@siswa.cakrawala.sch.id', 'siswa', '0071829384', FALSE, '12-MIPA-1', 'SMA Cakrawala Nusantara', 'active'),
('usr-siswa-02', 'Nabila Putri', 'nabila@siswa.cakrawala.sch.id', 'siswa', '0072938475', FALSE, '12-MIPA-1', 'SMA Cakrawala Nusantara', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO courses (id, code, title, category, description, teacher_id, teacher_name, target_class, banner_image)
VALUES
('crs-mat-12', 'MAT-XII-P', 'Matematika Peminatan Kelas XII', 'MIPA / Sains', 'Studi komprehensif kalkulus diferensial, integral tentu, dan pemodelan trigonometri terapan.', 'usr-guru-01', 'Drs. Bambang Suryono, M.Pd', '12-MIPA-1', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (id) DO NOTHING;
