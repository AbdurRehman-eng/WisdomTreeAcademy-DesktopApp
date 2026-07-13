# Wisdom Tree Academy — Implementation Plan
## Completing All Remaining Features

> **Read this before touching any code.**
> Each milestone is self-contained. Complete it fully — including tests and a git commit — before moving to the next one. This keeps the codebase stable at every checkpoint.

---

## Current State Summary

| Gap | Root Cause |
|---|---|
| Audio read-aloud plays no sound | `AudioControl.jsx` uses a `setTimeout` mock — no real TTS |
| Image upload does nothing | `e.preventDefault()` stub — no storage implementation |
| Pre-K and Kindergarten missing | Not in `seedDatabase()` in `main.cjs` |
| English sub-topics missing | Subject seeding only has `'English'` as one entry |
| No role-based access control | `App.jsx` router has no role checks |
| No "Change Password" screen | No dedicated IPC handler or UI screen |
| DB backup button is a toast stub | `SyncSettings.jsx` only calls `showToast()` |

---

## Architecture Principles

- **One concern per file.** Helpers stay in `utils/`, IPC handlers stay in `main.cjs`, UI stays in `src/screens/` and `src/components/`.
- **Preload is the contract.** Every new backend capability must be registered in `preload.cjs` before the frontend can use it.
- **No inline logic in JSX.** Extract business logic into custom hooks (`src/hooks/`) so screens stay thin and readable.
- **Tests mirror the implementation.** Every new utility function gets a unit test. Every new IPC handler gets an integration test stub.
- **Commit after each milestone.** The commit message format is: `feat(M#): short description`.

---

## Milestone 1 — Real Audio / Text-to-Speech
**Goal:** The read-aloud button in `AssessmentRunner` and `QuestionBank` actually speaks the question text aloud using the Web Speech API (built into Chromium, no extra install needed).

### Files to change

#### `src/hooks/useTTS.js` *(new file)*
```js
// Encapsulates all Web Speech API calls.
// Returns: { speak, pause, replay, cancel, isSpeaking }
// Accepts: text (string), rate (number, default 0.85 for children), pitch (number)
// On unmount: calls window.speechSynthesis.cancel() to avoid orphaned speech
```
Keeping TTS logic out of the component makes it easy to swap the engine later.

#### `src/components/common/AudioControl.jsx`
```
BEFORE (mock):
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setTimeout(() => setIsPlaying(false), 5000); // fake
    }
  }, [isPlaying]);

AFTER (real TTS):
  - Remove all setTimeout mock logic
  - Import and use useTTS hook
  - On play: speechSynthesis.speak(new SpeechSynthesisUtterance(audioText))
  - On pause: speechSynthesis.pause()
  - On replay: cancel current utterance, then re-speak
  - Waveform SVG animation already works via CSS — it just needs isSpeaking boolean
```

### Tests to write
`tests/unit/useTTS.test.js`
- Mock `window.speechSynthesis` (jsdom excludes it — add a manual mock)
- Test that `speak()` calls `speechSynthesis.speak` with correct text
- Test that `cancel()` calls `speechSynthesis.cancel`
- Test rate defaults to 0.85
- Test that `replay()` calls `cancel` then `speak`

### Commit checkpoint
```
git add src/hooks/useTTS.js src/components/common/AudioControl.jsx tests/unit/useTTS.test.js
git commit -m "feat(M1): implement real Web Speech API TTS in AudioControl"
```

---

## Milestone 2 — Image Upload with Questions
**Goal:** Teachers can attach one image per question. The image is stored on the local filesystem (in `userData/question_images/`) and the path is saved in the DB. Images display in the question card and during the assessment.

### Database changes

#### `db/schema.sql`
```sql
ALTER TABLE question_bank ADD COLUMN image_path TEXT;
```

#### `utils/migrations.cjs` *(new file)*
```js
// Runs idempotent ALTER TABLE migrations on startup.
// Checks column existence via PRAGMA table_info before each ALTER.
// Called from initDatabase() in main.cjs.
// Pattern: safe to call every app startup — only applies changes once.
function runMigrations(db) { ... }
module.exports = { runMigrations };
```

### Backend (main.cjs)

#### New IPC handler: `file:save-question-image`
```js
ipcMain.handle('file:save-question-image', async (event, { base64Data, mimeType }) => {
  // 1. Derive folder: path.join(app.getPath('userData'), 'question_images')
  // 2. fs.mkdirSync(folder, { recursive: true })
  // 3. Write buffer to UUID-named file (.jpg or .png based on mimeType)
  // 4. Return { success: true, filePath: absolutePath }
});
```

Register a custom `wta://` protocol to serve images safely from `userData`:
```js
// In app.whenReady():
protocol.registerFileProtocol('wta', (request, callback) => {
  const filePath = request.url.replace('wta:///', '');
  callback({ path: filePath });
});
```
This is needed because `contextIsolation: true` blocks direct `file://` access from the renderer.

#### Updated `db:save-question` handler
- Accept and persist `image_path` field

### Frontend

#### `preload.cjs`
```js
saveQuestionImage: (data) => ipcRenderer.invoke('file:save-question-image', data),
```

#### `src/hooks/useImageUpload.js` *(new file)*
```js
// Accepts a File object from <input type="file">
// Converts to base64, calls window.api.saveQuestionImage
// Returns { filePath, previewUrl }   (previewUrl = blob: URL for immediate preview)
// Rejects files > 5 MB with a user-friendly error
```

#### `src/components/common/QuestionCard.jsx` *(new file — extracted from QuestionBank.jsx)*
Currently the question card is inline JSX inside `QuestionBank.jsx`. Extract it:
```
Props: { question, onDelete, showDelete }
Renders: badge group, question text, image (if image_path present), MCQ options, AudioControl
```
Both `QuestionBank` and `AssessmentRunner` will import this component.

#### `src/screens/QuestionBank.jsx`
- Remove `e.preventDefault()` from the image input
- Use `useImageUpload` hook
- Show thumbnail preview before saving
- Pass `image_path` to `saveQuestion()`

#### `src/screens/AssessmentRunner.jsx`
- Replace inline question render with `<QuestionCard />`

### Tests to write
`tests/unit/useImageUpload.test.js`
- Mock `window.api.saveQuestionImage`
- Test that a File object produces a base64 payload
- Test a successful save returns a filePath
- Test files > 5 MB are rejected before the IPC call

`tests/unit/migrations.test.js`
- Use an in-memory better-sqlite3 db
- Test that `runMigrations` adds `image_path` when missing
- Test running it twice does not throw

### Commit checkpoint
```
git add db/schema.sql utils/migrations.cjs main.cjs preload.cjs \
        src/hooks/useImageUpload.js src/components/common/QuestionCard.jsx \
        src/screens/QuestionBank.jsx src/screens/AssessmentRunner.jsx \
        tests/unit/useImageUpload.test.js tests/unit/migrations.test.js
git commit -m "feat(M2): implement real image upload and extract QuestionCard component"
```

---

## Milestone 3 — Grade & Subject Expansion
**Goal:** Add Pre-K and Kindergarten. Add English sub-topics (Reading, Phonics, Vocabulary, Grammar, Spelling, Writing) as a `topic` field on questions — not as separate top-level subjects.

### Design decision
Do NOT add Phonics/Reading/etc. as rows in the `subjects` table — that breaks Assessment Setup. Instead, add a `topic` column on `question_bank` that only applies when `subject = 'English'`.

### Database changes

#### `db/schema.sql` / `utils/migrations.cjs`
```sql
ALTER TABLE question_bank ADD COLUMN topic TEXT;
```

### Backend (main.cjs)

#### `seedDatabase()`
```js
// Classes — add Pre-K and Kindergarten:
const defaultClasses = [
  'Nursery', 'Pre-K', 'Kindergarten',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'
];
// Add a migration seed for existing installs that already have 6 classes:
// INSERT OR IGNORE INTO classes ...
```

Update `db:save-question` and `db:get-questions` to include the `topic` field.

### Frontend

#### `src/data/constants.js` *(new file)*
Centralise all hardcoded lists currently scattered across screens:
```js
export const GRADES = [
  'Nursery', 'Pre-K', 'Kindergarten',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'
];
export const SUBJECTS = ['Mathematics', 'English', 'Science'];
export const ENGLISH_TOPICS = [
  'Reading', 'Phonics', 'Vocabulary', 'Grammar', 'Spelling', 'Writing'
];
```

Every screen imports from here. No more hardcoded arrays in JSX files.

#### `src/screens/QuestionBank.jsx`
- Import constants
- Show "Topic" dropdown when `formSubject === 'English'`
- Add topic filter in the left filter panel

#### `src/screens/Reports.jsx`
- Replace hardcoded `GRADES` array (currently line 8) with import from constants

### Tests to write
`tests/unit/constants.test.js`
- All 8 grades are present
- All 6 English topics are present
- No duplicate entries in any list

`tests/unit/gradeSeeding.test.js`
- Use in-memory DB
- Pre-K and Kindergarten are seeded
- Seeding is idempotent (runs twice without duplicating)

### Commit checkpoint
```
git add db/schema.sql utils/migrations.cjs main.cjs src/data/constants.js \
        src/screens/QuestionBank.jsx src/screens/Reports.jsx \
        tests/unit/constants.test.js tests/unit/gradeSeeding.test.js
git commit -m "feat(M3): add Pre-K, Kindergarten, and English topic sub-categories"
```

---

## Milestone 4 — Role-Based Access Control (RBAC)
**Goal:** Teachers cannot see or access admin-only screens. Enforced in both the sidebar and the screen router.

### What each role can access

| Screen | Admin | Teacher |
|---|---|---|
| Dashboard | ✓ | ✓ |
| Students | ✓ | ✓ |
| Attendance | ✓ | ✓ |
| Assessment Setup | ✓ | ✓ |
| Assessment Runner | ✓ | ✓ |
| Reports | ✓ | ✓ |
| Change Password | ✓ | ✓ |
| Teachers & Admins | ✓ | ✗ |
| Classes & Subjects | ✓ | ✗ |
| Question Bank | ✓ | ✗ |
| Sync & Settings | ✓ | ✗ |

### Files to change

#### `src/data/constants.js`
```js
export const ROLE_PERMISSIONS = {
  admin: ['dashboard', 'students', 'teachers-admins', 'classes-subjects',
          'question-bank', 'assessment-setup', 'assessment-runner',
          'assessment-results', 'attendance', 'reports', 'sync-settings', 'change-password'],
  teacher: ['dashboard', 'students', 'attendance', 'assessment-setup',
            'assessment-runner', 'assessment-results', 'reports', 'change-password'],
};
```

#### `src/hooks/usePermissions.js` *(new file)*
```js
// Returns: { canAccess(screenName), allowedScreens, isAdmin }
// Reads user.role from AppContext
```

#### `src/App.jsx`
- Import `usePermissions`
- Before rendering each screen: if `!canAccess(activeScreen)`, render `<AccessDenied />`

#### `src/components/layout/Sidebar.jsx`
- Import `usePermissions`
- Filter nav items using `allowedScreens`
- Teachers simply don't see admin-only nav items

#### `src/components/common/AccessDenied.jsx` *(new file)*
A friendly "You don't have permission to view this page" card with a "Go to Dashboard" button.

### Tests to write
`tests/unit/usePermissions.test.js`
- Admin → `canAccess('sync-settings')` returns true
- Teacher → `canAccess('sync-settings')` returns false
- Teacher → `canAccess('dashboard')` returns true
- `isAdmin` correctly set for each role

### Commit checkpoint
```
git add src/data/constants.js src/hooks/usePermissions.js src/App.jsx \
        src/components/layout/Sidebar.jsx src/components/common/AccessDenied.jsx \
        tests/unit/usePermissions.test.js
git commit -m "feat(M4): implement role-based access control for admin/teacher roles"
```

---

## Milestone 5 — Change Password Screen
**Goal:** Any logged-in user can change their own password. Current password must be verified before a new one is accepted.

### Backend (main.cjs)

#### New IPC handler: `db:change-password`
```js
ipcMain.handle('db:change-password', (event, userId, currentPassword, newPassword) => {
  // 1. Fetch user record by id
  // 2. verifyPassword(currentPassword, user.password_hash)
  //    → if false: return { success: false, error: 'Current password is incorrect.' }
  // 3. hash = hashPassword(newPassword)
  // 4. UPDATE teachers_admins SET password_hash = hash, sync_status='pending', updated_at=now WHERE id = userId
  // 5. Return { success: true }
});
```

### Frontend

#### `preload.cjs`
```js
changePassword: (userId, currentPw, newPw) =>
  ipcRenderer.invoke('db:change-password', userId, currentPw, newPw),
```

#### `src/screens/ChangePassword.jsx` *(new file)*
Form fields: Current Password, New Password, Confirm New Password.

Frontend validation (before any IPC call):
- New password ≥ 6 characters
- New password ≠ current password
- New password === confirm password

On success: show toast "Password updated successfully", navigate to dashboard.

#### `src/App.jsx`
Add `'change-password'` case to the screen router.

#### `src/components/layout/Sidebar.jsx`
Add "Change Password" link at the bottom of the sidebar, visible to all roles.

### Tests to write
`tests/unit/changePassword.test.js`
- In-memory DB with a seeded user
- Correct current password → update succeeds, new hash verifies correctly
- Wrong current password → returns error, stored hash unchanged
- IPC handler does not bypass the verification step

### Commit checkpoint
```
git add main.cjs preload.cjs src/screens/ChangePassword.jsx \
        src/App.jsx src/components/layout/Sidebar.jsx \
        tests/unit/changePassword.test.js
git commit -m "feat(M5): add change password screen with current-password verification"
```

---

## Milestone 6 — Real Database Backup & CSV Export
**Goal:** "Backup DB" opens a native Save dialog and copies the SQLite file to the chosen path. "Export CSV" exports the question bank as a well-formatted CSV.

### Backend (main.cjs)

#### New IPC handler: `file:backup-database`
```js
ipcMain.handle('file:backup-database', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Database Backup',
    defaultPath: `wisdom_tree_backup_${Date.now()}.db`,
    filters: [{ name: 'SQLite Database', extensions: ['db'] }]
  });
  if (result.canceled) return { success: false, canceled: true };
  fs.copyFileSync(dbPath, result.filePath);
  return { success: true, filePath: result.filePath };
});
```

#### New IPC handler: `file:export-questions-csv`
```js
ipcMain.handle('file:export-questions-csv', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Question Bank',
    defaultPath: `question_bank_${Date.now()}.csv`,
    filters: [{ name: 'CSV File', extensions: ['csv'] }]
  });
  if (result.canceled) return { success: false, canceled: true };
  const rows = db.prepare("SELECT * FROM question_bank WHERE status = 'active'").all();
  const { objectsToCSV } = require('./utils/csvHelper.cjs');
  const csv = objectsToCSV(rows, ['class','subject','topic','text','options_json','correct_answer','audio_text']);
  fs.writeFileSync(result.filePath, csv, 'utf8');
  return { success: true, count: rows.length };
});
```

#### `utils/csvHelper.cjs` *(new file)*
```js
// objectsToCSV(rows, columnOrder)
// - Generates header row from columnOrder
// - Quotes fields containing commas or newlines
// - Returns a complete CSV string
module.exports = { objectsToCSV };
```
Isolated from Electron so it can be unit-tested cleanly.

### Frontend

#### `preload.cjs`
```js
backupDatabase: () => ipcRenderer.invoke('file:backup-database'),
exportQuestionsCSV: () => ipcRenderer.invoke('file:export-questions-csv'),
```

#### `src/screens/SyncSettings.jsx`
```jsx
// Replace stub:
const handleBackup = async () => {
  const res = await window.api.backupDatabase();
  if (res.canceled) return;
  if (res.success) showToast(`Backup saved successfully.`, 'success');
  else showToast('Backup failed. Check disk space.', 'error');
};
```

#### `src/screens/QuestionBank.jsx`
Replace the broken `<a href="/templates/...">` CSV link with a real button:
```jsx
<Button onClick={handleExportCSV} icon={Download}>Export CSV</Button>
```

### Tests to write
`tests/unit/csvHelper.test.js`
- Basic CSV generation from array of objects
- Fields containing commas are quoted
- Header row matches `columnOrder`
- Empty array → returns only header row

`tests/unit/backupHandler.test.js`
- Mock `dialog.showSaveDialog` and `fs.copyFileSync`
- Cancel → returns `{ success: false, canceled: true }`
- Chosen path → `fs.copyFileSync` called with correct source and destination
- `copyFileSync` throws → returns `{ success: false, error: ... }`

### Commit checkpoint
```
git add main.cjs preload.cjs utils/csvHelper.cjs \
        src/screens/SyncSettings.jsx src/screens/QuestionBank.jsx \
        tests/unit/csvHelper.test.js tests/unit/backupHandler.test.js
git commit -m "feat(M6): implement real DB backup and question bank CSV export"
```

---

## Final Cleanup

### Login screen
- Remove the hardcoded `value={password}` default ("password") from the password field
- Add a proper username input (currently the username is inferred from the role tile, which breaks for multiple teachers with individual logins)

### syncHelper.cjs
- Add a clear comment block noting "V1: push-only. Pull sync is V2 scope." so the next developer has context.

### Run the full test suite
```
npm run test:unit
```
All tests must be green before the final commit.

### Final commit
```
git add .
git commit -m "chore: login field cleanup, sync docs, all tests passing"
git tag v1.1.0
```

---

## New File & Directory Map (additions only)

```
desktop/
├── src/
│   ├── data/
│   │   └── constants.js            ← M3/M4: grades, topics, RBAC permissions map
│   ├── hooks/
│   │   ├── useTTS.js               ← M1: Web Speech API hook
│   │   ├── useImageUpload.js       ← M2: file-to-base64 + save hook
│   │   └── usePermissions.js       ← M4: role access checking hook
│   ├── components/
│   │   └── common/
│   │       ├── QuestionCard.jsx    ← M2: reusable card (extracted from QuestionBank)
│   │       └── AccessDenied.jsx    ← M4: permission denied screen
│   └── screens/
│       └── ChangePassword.jsx      ← M5: new screen
├── utils/
│   ├── migrations.cjs              ← M2/M3: safe ALTER TABLE runner
│   └── csvHelper.cjs               ← M6: CSV serialisation (testable, no Electron deps)
└── tests/
    └── unit/
        ├── useTTS.test.js
        ├── useImageUpload.test.js
        ├── migrations.test.js
        ├── constants.test.js
        ├── gradeSeeding.test.js
        ├── usePermissions.test.js
        ├── changePassword.test.js
        ├── csvHelper.test.js
        └── backupHandler.test.js
```

---

## Milestone Summary

| # | Feature | Est. Time | Risk |
|---|---|---|---|
| M1 | Real Audio / TTS | 2–3 h | Low — Web Speech API is in Chromium |
| M2 | Image Upload | 4–5 h | Medium — custom protocol adds complexity |
| M3 | Grades & Topics | 2–3 h | Low — mostly data and constants |
| M4 | Role-Based Access Control | 3–4 h | Low — permissions map is clear |
| M5 | Change Password | 2–3 h | Low — IPC pattern already established |
| M6 | Backup & CSV Export | 3–4 h | Low — Electron dialog API is stable |
| — | Final Cleanup | 1–2 h | — |
| **Total** | | **17–24 h** | |
