-- Wisdom Tree Academy Local SQLite Schema (Offline-first)

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

CREATE TABLE IF NOT EXISTS teachers_admins (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL, -- 'owner', 'admin', 'it_administrator', 'head_teacher', 'accountant', 'secretary', 'teacher'
    name TEXT NOT NULL,
    email TEXT,
    phone_number TEXT,
    employee_id TEXT,
    hire_date TEXT,
    assigned_classes_json TEXT, -- JSON array of assigned class names
    assigned_subjects_json TEXT, -- JSON array of assigned subject names
    last_login INTEGER,
    status TEXT DEFAULT 'active', -- 'active', 'suspended', 'inactive', 'deleted'
    sync_status TEXT DEFAULT 'synced', -- 'synced', 'pending'
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    roll_number TEXT UNIQUE NOT NULL,
    class TEXT NOT NULL, -- 'Nursery', 'Grade 1', 'Grade 2', etc.
    status TEXT DEFAULT 'active', -- 'active', 'deleted'
    sync_status TEXT DEFAULT 'synced',
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active',
    sync_status TEXT DEFAULT 'synced',
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active',
    sync_status TEXT DEFAULT 'synced',
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS question_bank (
    id TEXT PRIMARY KEY,
    class TEXT NOT NULL,
    subject TEXT NOT NULL,
    text TEXT NOT NULL,
    audio_text TEXT,
    options_json TEXT NOT NULL, -- JSON array of MCQ options
    correct_answer TEXT NOT NULL,
    approval_status TEXT DEFAULT 'approved', -- 'approved', 'pending_approval'
    status TEXT DEFAULT 'active', -- 'active', 'archived', 'deleted'
    sync_status TEXT DEFAULT 'synced',
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS assessments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    results_json TEXT NOT NULL, -- JSON detailed responses
    date TEXT NOT NULL, -- YYYY-MM-DD
    sync_status TEXT DEFAULT 'pending',
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'student', 'teacher'
    target_id TEXT NOT NULL, -- references students.id or teachers_admins.id
    date TEXT NOT NULL, -- YYYY-MM-DD
    status TEXT NOT NULL, -- 'present', 'absent', 'late'
    sync_status TEXT DEFAULT 'pending',
    updated_at INTEGER NOT NULL,
    UNIQUE(type, target_id, date)
);

CREATE TABLE IF NOT EXISTS sync_log (
    id TEXT PRIMARY KEY,
    sync_time INTEGER NOT NULL,
    status TEXT NOT NULL, -- 'success', 'failed'
    changes_synced INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    timestamp INTEGER NOT NULL,
    sync_status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS question_versions (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL,
    class TEXT NOT NULL,
    subject TEXT NOT NULL,
    text TEXT NOT NULL,
    audio_text TEXT,
    options_json TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    changed_by TEXT NOT NULL,
    sync_status TEXT DEFAULT 'pending',
    updated_at INTEGER NOT NULL
);
