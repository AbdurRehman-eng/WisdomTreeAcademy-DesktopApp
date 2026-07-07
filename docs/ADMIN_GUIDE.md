# Wisdom Tree Academy: System Administrator Guide

This guide is designed for school network managers, system administrators, and tech coordinators who manage, configure, deploy, and maintain the Wisdom Tree Academy client application.

---

## 1. System Requirements & Architecture

The Wisdom Tree Academy client is built as an offline-first **Electron** application combining a native **SQLite** database backend with a **React + Vite** frontend interface.

| Requirement | Specification |
|-------------|---------------|
| **OS** | Windows 10 / 11 (64-bit) |
| **RAM** | 2 GB Minimum (4 GB Recommended) |
| **Disk Space** | ~500 MB (grows with local assessment logs and question data) |
| **Node.js** | v20.18.0 or newer (for build-time compilation) |
| **Database** | SQLite3 (stored locally inside User AppData) |

### Local Database Persistence
The application database (`wisdom_tree.db`) is stored inside the operating system's standard user data folder:
- **Windows Path:** `C:\Users\<username>\AppData\Roaming\desktop\wisdom_tree.db`
- **Developer Run Path:** `C:\Users\<username>\AppData\Roaming\Electron\wisdom_tree.db`

---

## 2. Compilation, Building, & Packaging

The application is packaged into a standalone installer or portable binary using `electron-builder`.

### Standard Development Actions
```bash
# 1. Navigate to the desktop project folder
cd desktop

# 2. Install dependencies (compiles better-sqlite3 native bindings)
npm install

# 3. Launch application in developer mode (Vite Dev Server + Electron dev mode)
npm run dev

# 4. Compile React frontend and package desktop app binary
npm run package
```

### Packaging Configurations (`package.json`)
The building engine parses rules in the `build` section of `desktop/package.json`:
- **Files to include:** Frontend assets inside `dist/`, main process `main.cjs`, preload script `preload.cjs`, DB schema `db/schema.sql`, and node dependencies.
- **Native rebuilding:** Electron Builder automatically triggers node-gyp compilation of `better-sqlite3` to target the target ABI architecture matching Windows x64.

---

## 3. SQLite Database Maintenance & Seeding

The application auto-generates the database and tables on its very first run. The schema is defined in `db/schema.sql`.

### Default Seeding
During initial database configuration, the application automatically seeds default accounts:
- **Administrator:** Username `admin` (Passcode: `admin123`)
- **Teacher:** Username `teacher` (Passcode: `teacher123`)
- **Default Grade levels:** Nursery to Grade 5
- **Default Subjects:** Mathematics, English, Science

### Custom SQL Admin Console
To manually inspect, patch, or query logs in the database, you can open `wisdom_tree.db` using any standard tool (e.g., **DB Browser for SQLite** or command-line `sqlite3`).

#### Useful SQL Scripts

* **Check Pending Cloud Sync Roster:**
  ```sql
  SELECT 'students' AS table_name, COUNT(*) AS count FROM students WHERE sync_status = 'pending'
  UNION ALL
  SELECT 'attendance', COUNT(*) FROM attendance WHERE sync_status = 'pending'
  UNION ALL
  SELECT 'assessments', COUNT(*) FROM assessments WHERE sync_status = 'pending';
  ```

* **Force Reset a Teacher/Admin Passcode:**
  The passcode utilizes PBKDF2 hashing. To set a password to `admin123` manually:
  ```sql
  UPDATE teachers_admins 
  SET password_hash = '85ce309c853cbdb24c75c024d262908f:330058b8f2c3d526e0be474ee4bf88a0815e96695cdca9f1d072eb0f1712a2a07c0879c3d4f18d531a74d2847c20c082729a738c6fe6029013c7c25b74c8b25d' 
  WHERE username = 'admin';
  ```

---

## 4. Cryptographic licensing & Key Verification

The application requires a valid, cryptographically signed activation key to run in full production mode. Licensing keys prevent forgery and track license expiration dates.

### Licensing Key Scheme
Keys follow the signature token format:
`WTA-[SchoolCode]-[MaxGradeLevel]-[Features]-[Signature]`

Example valid key: `WTA-SCH001-G5-FULL-7F1AB9E4`

- **SchoolCode:** Identifies the school branch (e.g., `SCH001`).
- **MaxGradeLevel:** Standard upper cap permitted (e.g., `G2` or `G5`).
- **Features:** Standard packages (e.g., `FULL`, `LITE`).
- **Signature:** A secure SHA-256 HMAC signature derived from the key content combined with a hidden server-side cryptographic pepper.

### Activation Workflow
1. Go to the **Sync & Settings** view in the sidebar.
2. Enter the activation key provided by the registry console.
3. The desktop app validates the signature locally using `utils/licenseHelper.cjs`.
4. If verified, the license state is persisted inside the SQLite `settings` table (`license_active = 'true'`), unlocking the evaluation features.

---

## 5. Question Bank CSV Import

The Question Bank supports bulk question import via a CSV file. This is the fastest way to load a large set of diagnostic questions into the system.

### Downloading the Template

1. Navigate to **Question Bank** in the sidebar.
2. Click **Get Template** — this downloads `sample_questions.csv` containing 10 example questions.
3. Open the file in any spreadsheet application (Excel, LibreOffice Calc) or a text editor.

### CSV Column Reference

| Column | Required | Description |
|--------|----------|-------------|
| `class` | Yes | Grade level: `Nursery`, `Grade 1`, `Grade 2`, `Grade 3`, `Grade 4`, `Grade 5` |
| `subject` | Yes | Subject name, e.g. `English`, `Mathematics`, `Science` |
| `text` | Yes | The question text displayed to the student |
| `option_a` | Yes | Answer choice A |
| `option_b` | Yes | Answer choice B |
| `option_c` | Yes | Answer choice C |
| `option_d` | Yes | Answer choice D |
| `correct_answer` | Yes | The correct option letter: `A`, `B`, `C`, or `D` (uppercase) |
| `audio_text` | No | Text read aloud via TTS. If blank, the question text is used |

### Importing Questions

1. Fill in your CSV file (keep the header row).
2. Navigate to **Question Bank** in the sidebar.
3. Click **Import CSV Template**.
4. Select your completed `.csv` file in the file picker.
5. The system validates each row and imports all valid questions in a single transaction.
6. A toast notification confirms the number of questions imported.

> **Note:** Rows with missing required columns or an invalid `correct_answer` value are silently skipped. Always verify the total count shown in the confirmation toast.

### Importing via SQL (Advanced)

For large datasets, questions can be inserted directly via the SQLite console:
```sql
INSERT INTO question_bank (id, class, subject, text, audio_text, options_json, correct_answer, status, sync_status, updated_at)
VALUES (
  lower(hex(randomblob(16))),
  'Grade 1', 'Mathematics',
  'What is 3 + 4?',
  'What is 3 plus 4?',
  '["6","7","8","9"]',
  'B',
  'active', 'pending',
  strftime('%s','now') * 1000
);
```

