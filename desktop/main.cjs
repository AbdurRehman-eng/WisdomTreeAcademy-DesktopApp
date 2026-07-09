const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Database = require('better-sqlite3');

let mainWindow;
let db;

// Single Instance Lock: Prevent multiple instances of the app from running concurrently
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

const { hashPassword, verifyPassword } = require('./utils/cryptoHelper.cjs');
const { validateLicenseKey } = require('./utils/licenseHelper.cjs');
const { pushPendingRecords } = require('./utils/syncHelper.cjs');

// Database Initialization
function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'wisdom_tree.db');
  console.log('Database path:', dbPath);
  
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL'); // High performance offline mode
  
  // Run schema
  const schemaPath = path.join(__dirname, 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  
  // Seed initial data if empty
  seedDatabase();
}

function seedDatabase() {
  // Check if admin exists
  const adminCheck = db.prepare("SELECT count(*) as count FROM teachers_admins WHERE role = 'admin'").get();
  if (adminCheck.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO teachers_admins (id, username, password_hash, role, name, email, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const now = Date.now();
    insertUser.run('A1', 'admin', hashPassword('admin123'), 'admin', 'System Administrator', 'admin@wisdomtree.edu', now);
    insertUser.run('T1', 'teacher', hashPassword('teacher123'), 'teacher', 'Teacher Williams', 'teacher@wisdomtree.edu', now);
  }

  // Seed default classes if empty
  const classCheck = db.prepare("SELECT count(*) as count FROM classes").get();
  if (classCheck.count === 0) {
    const insertClass = db.prepare("INSERT INTO classes (id, name, updated_at) VALUES (?, ?, ?)");
    const now = Date.now();
    const defaultClasses = ['Nursery', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];
    defaultClasses.forEach((cls, i) => {
      insertClass.run(`C${i+1}`, cls, now);
    });
  }

  // Seed default subjects if empty
  const subjectCheck = db.prepare("SELECT count(*) as count FROM subjects").get();
  if (subjectCheck.count === 0) {
    const insertSubj = db.prepare("INSERT INTO subjects (id, name, updated_at) VALUES (?, ?, ?)");
    const now = Date.now();
    const defaultSubjects = ['Mathematics', 'English', 'Science'];
    defaultSubjects.forEach((sub, i) => {
      insertSubj.run(`S${i+1}`, sub, now);
    });
  }

  // Seed default settings if empty
  const licenseCheck = db.prepare("SELECT count(*) as count FROM settings WHERE key = 'license_key'").get();
  if (licenseCheck.count === 0) {
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('license_key', 'WTA-8924-NURS-G5-EXP2028');
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('license_active', 'true');
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('online_status', 'synced');
  }

  // Seed default cloud sync configuration if empty
  const syncCheck = db.prepare("SELECT count(*) as count FROM settings WHERE key = 'sync_endpoint'").get();
  if (syncCheck.count === 0) {
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('sync_endpoint', 'https://duzxlwnkmfeqicymnqll.supabase.co');
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('sync_api_key', 'sb_publishable_TdK872qRZ_-GBTxXYrhcfg_C3uN5G9k');
  }
}

// Window Management
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 720,
    frame: false, // Custom framing for that premium simulated OS experience
    show: false, // Don't show the window until it's ready to avoid white flash
    backgroundColor: '#0f172a', // Slate-900 / dark theme background to match premium glassmorphism
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Load local Vite dev server in dev mode, or built index.html in production
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Show window once it is fully painted
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Registration
function registerIpcHandlers() {
  // Window controls
  ipcMain.on('window:minimize', () => mainWindow?.minimize());
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window:close', () => mainWindow?.close());

  // Auth IPC
  ipcMain.handle('db:login', (event, username, password) => {
    try {
      const user = db.prepare("SELECT * FROM teachers_admins WHERE username = ? AND status = 'active'").get(username);
      if (!user) return { success: false, error: 'Invalid credentials.' };
      
      const isValid = verifyPassword(password, user.password_hash);
      if (!isValid) return { success: false, error: 'Invalid credentials.' };

      return {
        success: true,
        user: { id: user.id, username: user.username, role: user.role, name: user.name, email: user.email }
      };
    } catch (e) {
      console.error(e);
      return { success: false, error: e.message };
    }
  });

  // Students IPC
  ipcMain.handle('db:get-students', () => {
    return db.prepare("SELECT * FROM students WHERE status = 'active' ORDER BY name ASC").all();
  });
  ipcMain.handle('db:save-student', (event, student) => {
    const { id, name, roll_number, class: cls } = student;
    const now = Date.now();
    const idToUse = id || crypto.randomUUID();
    db.prepare(`
      INSERT INTO students (id, name, roll_number, class, status, sync_status, updated_at)
      VALUES (?, ?, ?, ?, 'active', 'pending', ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        roll_number = excluded.roll_number,
        class = excluded.class,
        sync_status = 'pending',
        updated_at = excluded.updated_at
    `).run(idToUse, name, roll_number, cls, now);
    return { success: true, id: idToUse };
  });
  ipcMain.handle('db:delete-student', (event, id) => {
    const now = Date.now();
    db.prepare("UPDATE students SET status = 'deleted', sync_status = 'pending', updated_at = ? WHERE id = ?").run(now, id);
    return { success: true };
  });

  // Teachers/Admins IPC
  ipcMain.handle('db:get-teachers', () => {
    return db.prepare("SELECT id, username, role, name, email FROM teachers_admins WHERE status = 'active'").all();
  });
  ipcMain.handle('db:save-teacher', (event, teacher) => {
    const { id, username, password, role, name, email } = teacher;
    const now = Date.now();
    const idToUse = id || crypto.randomUUID();
    
    if (password) {
      const hash = hashPassword(password);
      db.prepare(`
        INSERT INTO teachers_admins (id, username, password_hash, role, name, email, status, sync_status, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'active', 'pending', ?)
        ON CONFLICT(id) DO UPDATE SET
          username = excluded.username,
          password_hash = excluded.password_hash,
          role = excluded.role,
          name = excluded.name,
          email = excluded.email,
          sync_status = 'pending',
          updated_at = excluded.updated_at
      `).run(idToUse, username, hash, role, name, email, now);
    } else {
      db.prepare(`
        UPDATE teachers_admins SET
          username = ?,
          role = ?,
          name = ?,
          email = ?,
          sync_status = 'pending',
          updated_at = ?
        WHERE id = ?
      `).run(username, role, name, email, now, idToUse);
    }
    return { success: true, id: idToUse };
  });
  ipcMain.handle('db:delete-teacher', (event, id) => {
    const now = Date.now();
    db.prepare("UPDATE teachers_admins SET status = 'deleted', sync_status = 'pending', updated_at = ? WHERE id = ?").run(now, id);
    return { success: true };
  });

  // Classes & Subjects
  ipcMain.handle('db:get-classes', () => {
    return db.prepare("SELECT * FROM classes WHERE status = 'active'").all();
  });
  ipcMain.handle('db:save-class', (event, cls) => {
    const { id, name } = cls;
    const now = Date.now();
    const idToUse = id || crypto.randomUUID();
    db.prepare(`
      INSERT INTO classes (id, name, status, sync_status, updated_at)
      VALUES (?, ?, 'active', 'pending', ?)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, sync_status = 'pending', updated_at = excluded.updated_at
    `).run(idToUse, name, now);
    return { success: true, id: idToUse };
  });
  ipcMain.handle('db:delete-class', (event, id) => {
    const now = Date.now();
    db.prepare("UPDATE classes SET status = 'deleted', sync_status = 'pending', updated_at = ? WHERE id = ?").run(now, id);
    return { success: true };
  });

  ipcMain.handle('db:get-subjects', () => {
    return db.prepare("SELECT * FROM subjects WHERE status = 'active'").all();
  });
  ipcMain.handle('db:save-subject', (event, subject) => {
    const { id, name } = subject;
    const now = Date.now();
    const idToUse = id || crypto.randomUUID();
    db.prepare(`
      INSERT INTO subjects (id, name, status, sync_status, updated_at)
      VALUES (?, ?, 'active', 'pending', ?)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, sync_status = 'pending', updated_at = excluded.updated_at
    `).run(idToUse, name, now);
    return { success: true, id: idToUse };
  });
  ipcMain.handle('db:delete-subject', (event, id) => {
    const now = Date.now();
    db.prepare("UPDATE subjects SET status = 'deleted', sync_status = 'pending', updated_at = ? WHERE id = ?").run(now, id);
    return { success: true };
  });

  // Questions
  ipcMain.handle('db:get-questions', () => {
    const questions = db.prepare("SELECT * FROM question_bank WHERE status = 'active'").all();
    return questions.map(q => ({
      ...q,
      options: JSON.parse(q.options_json)
    }));
  });
  ipcMain.handle('db:save-question', (event, q) => {
    const { id, class: cls, subject, text, audioText, options, correct_answer } = q;
    const now = Date.now();
    const idToUse = id || crypto.randomUUID();
    const optionsJson = JSON.stringify(options);
    db.prepare(`
      INSERT INTO question_bank (id, class, subject, text, audio_text, options_json, correct_answer, status, sync_status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 'pending', ?)
      ON CONFLICT(id) DO UPDATE SET
        class = excluded.class,
        subject = excluded.subject,
        text = excluded.text,
        audio_text = excluded.audio_text,
        options_json = excluded.options_json,
        correct_answer = excluded.correct_answer,
        sync_status = 'pending',
        updated_at = excluded.updated_at
    `).run(idToUse, cls, subject, text, audioText, optionsJson, correct_answer, now);
    return { success: true, id: idToUse };
  });
  ipcMain.handle('db:delete-question', (event, id) => {
    const now = Date.now();
    db.prepare("UPDATE question_bank SET status = 'deleted', sync_status = 'pending', updated_at = ? WHERE id = ?").run(now, id);
    return { success: true };
  });
  ipcMain.handle('db:import-questions', (event, questions) => {
    const now = Date.now();
    const insert = db.prepare(`
      INSERT INTO question_bank (id, class, subject, text, audio_text, options_json, correct_answer, status, sync_status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 'pending', ?)
    `);
    
    const transaction = db.transaction((list) => {
      for (const q of list) {
        insert.run(
          q.id || crypto.randomUUID(),
          q.class,
          q.subject,
          q.text,
          q.audioText || '',
          JSON.stringify(q.options),
          q.correct,
          now
        );
      }
    });
    
    transaction(questions);
    return { success: true };
  });

  // Attendance
  ipcMain.handle('db:get-attendance', (event, date, type) => {
    return db.prepare("SELECT * FROM attendance WHERE date = ? AND type = ?").all(date, type);
  });
  ipcMain.handle('db:save-attendance', (event, records) => {
    const now = Date.now();
    const insert = db.prepare(`
      INSERT INTO attendance (id, type, target_id, date, status, sync_status, updated_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
      ON CONFLICT(type, target_id, date) DO UPDATE SET
        status = excluded.status,
        sync_status = 'pending',
        updated_at = excluded.updated_at
    `);

    const transaction = db.transaction((list) => {
      for (const rec of list) {
        const id = rec.id || crypto.randomUUID();
        insert.run(id, rec.type, rec.target_id, rec.date, rec.status, now);
      }
    });

    transaction(records);
    return { success: true };
  });

  // Assessments
  ipcMain.handle('db:get-assessments', () => {
    const assessments = db.prepare(`
      SELECT a.*, s.name as student_name, s.roll_number as student_roll, s.class as student_class
      FROM assessments a
      JOIN students s ON a.student_id = s.id
      ORDER BY a.updated_at DESC
    `).all();
    
    return assessments.map(a => ({
      ...a,
      results: JSON.parse(a.results_json)
    }));
  });
  ipcMain.handle('db:save-assessment-result', (event, result) => {
    const { id, student_id, score, total_questions, results } = result;
    const now = Date.now();
    const idToUse = id || crypto.randomUUID();
    const resultsJson = JSON.stringify(results);
    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    db.prepare(`
      INSERT INTO assessments (id, student_id, score, total_questions, results_json, date, sync_status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(idToUse, student_id, score, total_questions, resultsJson, dateStr, now);
    
    return { success: true, id: idToUse };
  });

  // Licensing verification (Offline Cryptographic Verification)
  ipcMain.handle('license:validate', (event, key) => {
    try {
      const result = validateLicenseKey(key);
      if (!result.success) {
        return { success: false, error: result.error };
      }
      
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('license_key', ?)")
        .run(key);
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('license_active', 'true')")
        .run();
        
      return { success: true, info: result.info };
    } catch (e) {
      console.error(e);
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('license:get-info', () => {
    try {
      const keyRow = db.prepare("SELECT value FROM settings WHERE key = 'license_key'").get();
      const activeRow = db.prepare("SELECT value FROM settings WHERE key = 'license_active'").get();
      return {
        key: keyRow ? keyRow.value : '',
        active: activeRow ? activeRow.value === 'true' : false
      };
    } catch (e) {
      return { key: '', active: false };
    }
  });

  // Sync IPC
  ipcMain.handle('sync:get-info', () => {
    try {
      // Count tables with 'pending' sync status
      const pendingStudents = db.prepare("SELECT count(*) as count FROM students WHERE sync_status = 'pending'").get().count;
      const pendingTeachers = db.prepare("SELECT count(*) as count FROM teachers_admins WHERE sync_status = 'pending'").get().count;
      const pendingClasses = db.prepare("SELECT count(*) as count FROM classes WHERE sync_status = 'pending'").get().count;
      const pendingSubjects = db.prepare("SELECT count(*) as count FROM subjects WHERE sync_status = 'pending'").get().count;
      const pendingQuestions = db.prepare("SELECT count(*) as count FROM question_bank WHERE sync_status = 'pending'").get().count;
      const pendingAssessments = db.prepare("SELECT count(*) as count FROM assessments WHERE sync_status = 'pending'").get().count;
      const pendingAttendance = db.prepare("SELECT count(*) as count FROM attendance WHERE sync_status = 'pending'").get().count;
      
      const totalPending = pendingStudents + pendingTeachers + pendingClasses + pendingSubjects + pendingQuestions + pendingAssessments + pendingAttendance;
      
      const onlineRow = db.prepare("SELECT value FROM settings WHERE key = 'online_status'").get();
      const onlineStatus = onlineRow ? onlineRow.value : 'synced'; // 'synced', 'offline', 'syncing'
      
      return {
        pendingCount: totalPending,
        status: onlineStatus
      };
    } catch (e) {
      return { pendingCount: 0, status: 'offline' };
    }
  });

  ipcMain.handle('sync:toggle-online', () => {
    try {
      const current = db.prepare("SELECT value FROM settings WHERE key = 'online_status'").get()?.value;
      const nextStatus = current === 'offline' ? 'synced' : 'offline';
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('online_status', ?)")
        .run(nextStatus);
      return { success: true, status: nextStatus };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('sync:trigger', async () => {
    try {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('online_status', 'syncing')").run();

      // Read cloud config from settings table
      const urlRow = db.prepare("SELECT value FROM settings WHERE key = 'sync_endpoint'").get();
      const keyRow = db.prepare("SELECT value FROM settings WHERE key = 'sync_api_key'").get();
      const projectUrl = urlRow ? urlRow.value : '';
      const apiKey     = keyRow ? keyRow.value : '';

      const result = await pushPendingRecords(db, projectUrl, apiKey);

      if (result.success) {
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('online_status', 'synced')").run();
        return { success: true, syncedCount: result.syncedCount };
      } else {
        // Partial sync — stay online but report errors
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('online_status', 'synced')").run();
        return { success: false, error: result.errors.join('; '), syncedCount: result.syncedCount };
      }
    } catch (e) {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('online_status', 'offline')").run();
      return { success: false, error: e.message };
    }
  });

  // Sync configuration IPC
  ipcMain.handle('sync:set-config', (event, projectUrl, apiKey) => {
    try {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('sync_endpoint', ?)").run(projectUrl || '');
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('sync_api_key', ?)").run(apiKey || '');
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('sync:get-config', () => {
    try {
      const urlRow = db.prepare("SELECT value FROM settings WHERE key = 'sync_endpoint'").get();
      const keyRow = db.prepare("SELECT value FROM settings WHERE key = 'sync_api_key'").get();
      return {
        projectUrl: urlRow ? urlRow.value : '',
        apiKey:     keyRow ? keyRow.value : ''
      };
    } catch (e) {
      return { projectUrl: '', apiKey: '' };
    }
  });

  ipcMain.handle('db:get-dashboard-data', () => {
    try {
      const studentCount = db.prepare("SELECT count(*) as count FROM students WHERE status = 'active'").get().count;
      const facultyCount = db.prepare("SELECT count(*) as count FROM teachers_admins WHERE status = 'active'").get().count;
      const classCount = db.prepare("SELECT count(*) as count FROM classes WHERE status = 'active'").get().count;
      const assessmentCount = db.prepare("SELECT count(*) as count FROM assessments").get().count;

      const todayStr = new Date().toISOString().split('T')[0];
      const todayAttendance = db.prepare("SELECT status, count(*) as count FROM attendance WHERE date = ? AND type = 'student' GROUP BY status").all(todayStr);
      let todayAttendanceRate = 'Pending';
      if (todayAttendance.length > 0) {
        let present = 0;
        let late = 0;
        let absent = 0;
        todayAttendance.forEach(row => {
          if (row.status === 'present') present = row.count;
          else if (row.status === 'late') late = row.count;
          else if (row.status === 'absent') absent = row.count;
        });
        const total = present + late + absent;
        if (total > 0) {
          todayAttendanceRate = `${Math.round(((present + (late * 0.8)) / total) * 100)}%`;
        }
      }

      const pendingItems = [];
      const pendingSt = db.prepare("SELECT name, class, updated_at FROM students WHERE sync_status = 'pending' ORDER BY updated_at DESC LIMIT 5").all();
      pendingSt.forEach(x => pendingItems.push({ type: 'Student', detail: `${x.name} (${x.class})`, timestamp: x.updated_at }));
      const pendingT = db.prepare("SELECT name, role, updated_at FROM teachers_admins WHERE sync_status = 'pending' ORDER BY updated_at DESC LIMIT 5").all();
      pendingT.forEach(x => pendingItems.push({ type: 'Staff', detail: `${x.name} (${x.role})`, timestamp: x.updated_at }));
      const pendingCl = db.prepare("SELECT name, updated_at FROM classes WHERE sync_status = 'pending' ORDER BY updated_at DESC LIMIT 5").all();
      pendingCl.forEach(x => pendingItems.push({ type: 'Classroom', detail: x.name, timestamp: x.updated_at }));
      const pendingSub = db.prepare("SELECT name, updated_at FROM subjects WHERE sync_status = 'pending' ORDER BY updated_at DESC LIMIT 5").all();
      pendingSub.forEach(x => pendingItems.push({ type: 'Subject', detail: x.name, timestamp: x.updated_at }));
      const pendingQu = db.prepare("SELECT class, subject, updated_at FROM question_bank WHERE sync_status = 'pending' ORDER BY updated_at DESC LIMIT 5").all();
      pendingQu.forEach(x => pendingItems.push({ type: 'Question', detail: `${x.subject} for ${x.class}`, timestamp: x.updated_at }));
      const pendingAs = db.prepare("SELECT a.updated_at, s.name, a.score, a.total_questions FROM assessments a JOIN students s ON a.student_id = s.id WHERE a.sync_status = 'pending' ORDER BY a.updated_at DESC LIMIT 5").all();
      pendingAs.forEach(x => pendingItems.push({ type: 'Assessment', detail: `${x.name} - ${x.score}/${x.total_questions}`, timestamp: x.updated_at }));
      const pendingAt = db.prepare("SELECT a.updated_at, s.name, a.date, a.status FROM attendance a JOIN students s ON a.target_id = s.id WHERE a.sync_status = 'pending' ORDER BY a.updated_at DESC LIMIT 5").all();
      pendingAt.forEach(x => pendingItems.push({ type: 'Attendance', detail: `${x.name} - ${x.status} (${x.date})`, timestamp: x.updated_at }));

      pendingItems.sort((a, b) => b.timestamp - a.timestamp);
      const pendingSyncQueue = pendingItems.slice(0, 10).map(item => ({
        type: item.type,
        detail: item.detail,
        date: new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      }));

      const activityLog = [];
      const recentAssessments = db.prepare("SELECT a.updated_at, a.score, a.total_questions, s.name as student_name FROM assessments a JOIN students s ON a.student_id = s.id ORDER BY a.updated_at DESC LIMIT 5").all();
      recentAssessments.forEach(x => {
        activityLog.push({
          type: 'assessment',
          message: `${x.student_name} completed Diagnostic Assessment (${x.score}/${x.total_questions})`,
          user: 'Teacher',
          timestamp: x.updated_at
        });
      });
      const recentSyncs = db.prepare("SELECT sync_time, status, changes_synced FROM sync_log ORDER BY sync_time DESC LIMIT 5").all();
      recentSyncs.forEach(x => {
        activityLog.push({
          type: 'sync',
          message: `Database sync ${x.status} (${x.changes_synced} items synced)`,
          user: 'System',
          timestamp: x.sync_time
        });
      });
      const recentStudents = db.prepare("SELECT name, updated_at FROM students WHERE status = 'active' ORDER BY updated_at DESC LIMIT 5").all();
      recentStudents.forEach(x => {
        activityLog.push({
          type: 'student',
          message: `Registered student ${x.name}`,
          user: 'Administrator',
          timestamp: x.updated_at
        });
      });
      const recentAttendance = db.prepare("SELECT a.updated_at, a.date, s.name, a.status FROM attendance a JOIN students s ON a.target_id = s.id WHERE a.type = 'student' ORDER BY a.updated_at DESC LIMIT 5").all();
      recentAttendance.forEach(x => {
        activityLog.push({
          type: 'attendance',
          message: `Attendance marked ${x.status} for ${x.name} (${x.date})`,
          user: 'Teacher',
          timestamp: x.updated_at
        });
      });
      const recentQuestions = db.prepare("SELECT class, subject, updated_at FROM question_bank WHERE status = 'active' ORDER BY updated_at DESC LIMIT 5").all();
      recentQuestions.forEach(x => {
        activityLog.push({
          type: 'question',
          message: `Added new question to ${x.class} ${x.subject} Bank`,
          user: 'Administrator',
          timestamp: x.updated_at
        });
      });

      activityLog.sort((a, b) => b.timestamp - a.timestamp);
      const formattedActivityLog = activityLog.slice(0, 10).map((log, idx) => {
        let timeDesc = 'Just now';
        const diffMs = Date.now() - log.timestamp;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHrs = Math.floor(diffMins / 60);
        if (diffMins > 0 && diffMins < 60) {
          timeDesc = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        } else if (diffHrs > 0 && diffHrs < 24) {
          timeDesc = `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
        } else if (diffHrs >= 24) {
          timeDesc = new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }
        return {
          id: `act_${idx}_${log.timestamp}`,
          type: log.type,
          message: log.message,
          user: log.user,
          time: timeDesc
        };
      });

      const classrooms = db.prepare("SELECT name FROM classes WHERE status = 'active'").all();
      const studentCounts = db.prepare("SELECT class, count(*) as count FROM students WHERE status = 'active' GROUP BY class").all();
      const countMap = {};
      studentCounts.forEach(x => { countMap[x.class] = x.count; });
      const activeClasses = classrooms.map(c => ({
        name: c.name,
        studentCount: countMap[c.name] || 0
      }));

      return {
        studentCount,
        facultyCount,
        classCount,
        assessmentCount,
        todayAttendanceRate,
        pendingSyncQueue,
        activityLog: formattedActivityLog,
        activeClasses
      };
    } catch (e) {
      console.error(e);
      return {
        studentCount: 0,
        facultyCount: 0,
        classCount: 0,
        assessmentCount: 0,
        todayAttendanceRate: 'Error',
        pendingSyncQueue: [],
        activityLog: [],
        activeClasses: []
      };
    }
  });
}

// App lifecycle
app.whenReady().then(() => {
  initDatabase();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('second-instance', (event, commandLine, workingDirectory) => {
  // Focus the existing window when user tries to start another instance
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    db?.close();
    app.quit();
  }
});
