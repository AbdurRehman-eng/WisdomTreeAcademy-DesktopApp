# Wisdom Tree Academy: Developer Guide & Architecture Manual

This manual is for developers modifying, extending, or testing the Wisdom Tree Academy Electron desktop app and its database integration.

---

## 1. Process Architecture

The desktop application is built on Electron's multi-process model:

```
                  ┌──────────────────────────────┐
                  │        Main Process          │
                  │  (Node.js, main.cjs, SQLite) │
                  └──────────────┬───────────────┘
                                 │
                         IPC Channels (Bridge)
                                 │
                  ┌──────────────▼───────────────┐
                  │       Preload Script         │
                  │        (preload.cjs)         │
                  └──────────────┬───────────────┘
                                 │
                           window.api
                                 │
                  ┌──────────────▼──────────────┐
                  │      Renderer Process       │
                  │ (React 19, App.jsx, Vite)   │
                  └─────────────────────────────┘
```

1. **Main Process (`main.cjs`):**
   - Configures the browser window.
   - Manages SQLite database reading, writing, transactions, and schema execution.
   - Listens to IPC calls and performs cryptographic tasks.
2. **Preload Script (`preload.cjs`):**
   - Runs with Node privileges but isolated from the window context.
   - Exposes safe wrapper functions via `contextBridge.revealInMainWorld('api', {...})`.
3. **Renderer Process (`src/`):**
   - SPA built with React 19 and bundled using Vite.
   - Standard browser environment with no direct file system or SQLite access.
   - Queries database records asynchronously via `window.api.db*` IPC invocations.

---

## 2. SQLite Database Schema Details

The database is built from the schema script `desktop/db/schema.sql`. The core tables include:

```sql
-- Teachers and Administrators
CREATE TABLE IF NOT EXISTS teachers_admins (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL, -- 'admin' | 'teacher'
  name TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'active', -- 'active' | 'deleted'
  sync_status TEXT DEFAULT 'pending', -- 'synced' | 'pending'
  updated_at INTEGER NOT NULL
);

-- Student Registry
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  roll_number TEXT UNIQUE NOT NULL,
  class TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  sync_status TEXT DEFAULT 'pending',
  updated_at INTEGER NOT NULL
);

-- Diagnostic Question Bank
CREATE TABLE IF NOT EXISTS question_bank (
  id TEXT PRIMARY KEY,
  class TEXT NOT NULL,
  subject TEXT NOT NULL,
  text TEXT NOT NULL,
  audio_text TEXT,
  options_json TEXT NOT NULL, -- Serialized JSON array of strings
  correct_answer TEXT NOT NULL, -- 'A' | 'B' | 'C' | 'D'
  status TEXT DEFAULT 'active',
  sync_status TEXT DEFAULT 'pending',
  updated_at INTEGER NOT NULL
);

-- Attendance Ledger
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'student' | 'teacher'
  target_id TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  status TEXT NOT NULL, -- 'present' | 'absent' | 'late'
  sync_status TEXT DEFAULT 'pending',
  updated_at INTEGER NOT NULL,
  UNIQUE(type, target_id, date)
);

-- Diagnostic Run Assessments
CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  results_json TEXT NOT NULL, -- Detailed answer choices, correct/incorrect flags
  sync_status TEXT DEFAULT 'pending',
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(student_id) REFERENCES students(id)
);
```

---

## 3. Preload IPC API Interface

Preload maps channels to async functions. If running inside a standard web browser (outside Electron), `window.api` is undefined. The frontend code is written defensively to fallback to Mock data:

```javascript
// Example IPC invocation in AppContext.jsx or screen components:
if (window.api) {
  const students = await window.api.getStudents();
  setStudentList(students);
} else {
  // Use local component state mock variables
}
```

### Supported IPC Methods:
- **`window.api.login(username, password)`**: Returns `{ success: true, user }` or error.
- **`window.api.getStudents()` / `saveStudent(student)` / `deleteStudent(id)`**: CRUD actions for students.
- **`window.api.getQuestions()` / `saveQuestion(q)` / `deleteQuestion(id)`**: CRUD actions for MCQs.
- **`window.api.getAttendance(date, type)` / `saveAttendance(records)`**: Read and save daily attendance.
- **`window.api.getAssessments()` / `saveAssessmentResult(result)`**: Save and load scorecards.
- **`window.api.getLicenseInfo()` / `saveLicenseKey(key)`**: Validate and check activation.
- **`window.api.getSyncInfo()` / `performSync()`**: Query local database pending logs count.

---

## 4. Cryptographic Licensing & Hashing

- **Password Hashing:** Implemented inside `utils/cryptoHelper.cjs` using Node's native `crypto.pbkdf2Sync` algorithm.
  - PBKDF2 iterations: `1000`
  - Hash byte length: `64`
  - Salt length: `16` bytes (stored prefixed to hash string separated by `:`)
- **License Signature Key:** Verified inside `utils/licenseHelper.cjs`.
  - Signature checks structure: `WTA-[SchoolCode]-[MaxGradeLevel]-[Features]-[Signature]`
  - Signature is computed as `crypto.createHash('sha256').update(content + saltPepper).digest('hex').substring(0, 8)`

---

## 5. Testing Guidelines

Tests are written under `desktop/tests` using **Vitest** configured to run in the `node` environment (which supports native SQLite database operations and Node's crypto modules).

- **Execution:**
  ```bash
  cd desktop
  npm run test:unit
  ```
- **Configuration:** Guided by `vite.config.mjs` with Node environment configuration:
  ```javascript
  test: {
    environment: 'node',
    globals: true,
  }
  ```

---

## 6. Cloud Sync Architecture (`utils/syncHelper.cjs`)

### V1 Design — Push-Only via Supabase REST API

The sync system uses Node.js's built-in `https` module to POST rows to a Supabase project using the standard REST upsert endpoint. No external npm packages are required.

```
Desktop (main.cjs)
  └── ipcMain.handle('sync:trigger')
       └── pushPendingRecords(db, projectUrl, apiKey)    [syncHelper.cjs]
            ├── for each table in TABLES_CONFIG:
            │    ├── SELECT rows WHERE sync_status = 'pending'
            │    ├── POST rows to https://<project>.supabase.co/rest/v1/<table>
            │    │   Headers: apikey, Authorization, Prefer: resolution=merge-duplicates
            │    └── UPDATE rows SET sync_status = 'synced' on HTTP 2xx
            └── INSERT into sync_log (audit trail)
```

### `TABLES_CONFIG`

The `TABLES_CONFIG` array in `syncHelper.cjs` defines which tables to sync and how to map SQLite rows to cloud payloads. Each entry has:
- `selectQuery` — SQL to select pending rows
- `markSynced` — SQL to mark rows synced after successful push
- `mapRow(r)` — transforms a SQLite row object to a JSON-safe cloud payload

**Password columns are intentionally excluded** from the `teachers_admins` mapping — passwords stay local-only.

### Configuration Storage

Cloud credentials are stored in the local `settings` table as plain key-value rows:
- `sync_endpoint` — Supabase project URL
- `sync_api_key` — Supabase anon key

These are read by `main.cjs` at sync time. The settings are set via the **Sync & Settings** screen or directly via SQL.

### Extending for V2 Bidirectional Sync

To add pull sync (cloud → local):
1. Add a `pullUpdatedRecords(db, projectUrl, apiKey, lastSyncTime)` export to `syncHelper.cjs`.
2. Query Supabase with `?updated_at=gt.<timestamp>` filter (Supabase REST supports this natively).
3. Merge results into local SQLite using `INSERT OR REPLACE`.
4. Store the last successful pull timestamp in `settings` as `last_pull_time`.

### Error Handling

- Individual table failures do not abort the entire sync — the loop continues.
- All errors are collected and returned as `errors[]` in the result.
- The `sync_log` table records whether the sync was `success` or `partial`.
- Network timeouts are set to 15 seconds per table request.
