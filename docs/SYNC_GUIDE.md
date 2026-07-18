# Wisdom Tree Academy: Cloud Synchronization Guide

This guide explains how to configure and activate real-time cloud synchronization between the local Wisdom Tree Academy desktop client and a remote Supabase database.

---

## Overview

The synchronization system is **push-only** in V1:

```
Local SQLite (Desktop) ──► Supabase PostgreSQL (Cloud)
```

Data flows one direction — from the school's desktop application up to the cloud. The Owner Dashboard then reads from that cloud database remotely. Bidirectional (pull) sync is planned for V2.

---

## 1. Creating a Free Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a free account.
2. Click **"New Project"**.
3. Choose a project name (e.g., `wisdom-tree-academy`), set a strong database password, and select the region closest to your school.
4. Wait for the project to initialize (~1 minute).
5. Navigate to **Settings → API** in the Supabase dashboard to find:
   - **Project URL:** Looks like `https://xxxxxxxxxxxxxxxx.supabase.co`
   - **Anon/Public Key:** Starts with `eyJ...`

---

## 2. Creating Cloud Database Tables

Run these SQL statements in the **Supabase SQL Editor** (Database → SQL Editor → New Query):

```sql
-- Students
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  roll_number TEXT,
  class TEXT,
  status TEXT DEFAULT 'active',
  updated_at BIGINT
);

-- Teachers / Admins
CREATE TABLE IF NOT EXISTS teachers_admins (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  role TEXT,
  name TEXT,
  email TEXT,
  status TEXT DEFAULT 'active',
  updated_at BIGINT
);

-- Classes
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  updated_at BIGINT
);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  updated_at BIGINT
);

-- Question Bank
CREATE TABLE IF NOT EXISTS question_bank (
  id TEXT PRIMARY KEY,
  class TEXT,
  subject TEXT,
  text TEXT,
  audio_text TEXT,
  options_json TEXT,
  correct_answer TEXT,
  image_path TEXT,
  status TEXT DEFAULT 'active',
  updated_at BIGINT
);

-- Assessments
CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  student_id TEXT,
  score INTEGER,
  total_questions INTEGER,
  results_json TEXT,
  date TEXT,
  updated_at BIGINT
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  updated_at BIGINT,
  UNIQUE(type, target_id, date)
);
```

---

## 3. Configuring the Desktop App

1. Open the Wisdom Tree Academy desktop application.
2. Log in as **Administrator**.
3. Navigate to **Sync &amp; Settings** in the sidebar.
4. Scroll down to the **Cloud Sync Configuration** card.
5. Enter your:
   - **Supabase Project URL** (e.g., `https://abcdefghij.supabase.co`)
   - **Supabase Anon API Key** (from Supabase → Settings → API)
6. Click **Save Cloud Configuration**.

The configuration is stored encrypted in the local SQLite `settings` table and persists across application restarts.

---

## 4. Triggering a Sync

### Manual Sync
1. Go to **Sync &amp; Settings** or the **Dashboard**.
2. Click **Perform Database Synchronization**.
3. The application pushes all records with `sync_status = 'pending'` to Supabase.
4. Each successfully synced row is marked `sync_status = 'synced'` locally.
5. A toast notification confirms the number of records synced.

### What Gets Synced
The following tables are pushed on each sync:
- `students` — enrolled student records
- `teachers_admins` — staff accounts (passwords **not** synced for security)
- `classes` — grade/class definitions
- `subjects` — subject definitions
- `question_bank` — diagnostic MCQs
- `assessments` — completed assessment results with scores
- `attendance` — daily attendance logs

---

## 5. Verifying Sync in Supabase

1. Open the Supabase dashboard for your project.
2. Navigate to **Table Editor** (left sidebar).
3. Select a table (e.g., `students`) — you should see the records pushed from the desktop.
4. You can also run queries in the SQL Editor:
   ```sql
   SELECT COUNT(*) FROM assessments;
   SELECT * FROM students ORDER BY updated_at DESC LIMIT 10;
   ```

---

## 6. Security Notes

> **Important:** The anon key used is Supabase's public-facing key designed for client-side access. By default, any Supabase table is accessible with this key.

**Recommended security hardening (optional but advised for production):**

1. **Enable Row-Level Security (RLS)** on all tables in Supabase:
   ```sql
   ALTER TABLE students ENABLE ROW LEVEL SECURITY;
   ALTER TABLE teachers_admins ENABLE ROW LEVEL SECURITY;
   ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
   ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
   ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;
   ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
   ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
   ```

2. **Create policies** that allow full CRUD (needed for push synchronization upserts and dashboard operations) for the anon and authenticated roles:
   ```sql
   CREATE POLICY "allow_all_operations" ON students FOR ALL TO public USING (true) WITH CHECK (true);
   CREATE POLICY "allow_all_operations" ON teachers_admins FOR ALL TO public USING (true) WITH CHECK (true);
   CREATE POLICY "allow_all_operations" ON classes FOR ALL TO public USING (true) WITH CHECK (true);
   CREATE POLICY "allow_all_operations" ON subjects FOR ALL TO public USING (true) WITH CHECK (true);
   CREATE POLICY "allow_all_operations" ON question_bank FOR ALL TO public USING (true) WITH CHECK (true);
   CREATE POLICY "allow_all_operations" ON assessments FOR ALL TO public USING (true) WITH CHECK (true);
   CREATE POLICY "allow_all_operations" ON attendance FOR ALL TO public USING (true) WITH CHECK (true);
   ```

3. **Use a service role key** (instead of the anon key) and keep it in a server-side proxy rather than embedding it in the desktop client. This is the recommended V2 architecture.

---

## 7. Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| "Cloud sync is not configured" toast | URL or API key not set | Enter credentials in Sync &amp; Settings |
| HTTP 401 error in sync log | Invalid API key | Re-copy the key from Supabase → Settings → API |
| HTTP 404 error | Table doesn't exist in Supabase | Run the SQL table creation scripts above |
| Timeout after 15 seconds | No internet connection | Ensure the machine has internet access and the Supabase URL is correct |
| Records still show "Pending" after sync | Sync partially failed | Check the `sync_log` table locally for error details |

---

## 8. Sync Log (Local)

The desktop app maintains a local sync audit log in the `sync_log` SQLite table:

```sql
SELECT * FROM sync_log ORDER BY sync_time DESC LIMIT 20;
```

Each row records:
- `sync_time` — Unix timestamp of the sync attempt
- `status` — `success` or `partial`
- `changes_synced` — number of rows pushed
