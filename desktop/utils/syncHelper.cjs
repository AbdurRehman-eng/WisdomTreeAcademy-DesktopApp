/**
 * syncHelper.cjs
 *
 * Handles real cloud synchronization by pushing locally-pending SQLite rows
 * to a configured Supabase project via the REST API (upsert).
 *
 * Sync direction in V1: LOCAL → CLOUD (push only).
 * Includes robust conflict and redundancy warnings.
 */

const https = require('https');
const url   = require('url');

/**
 * Make a single HTTPS GET request to check for existing rows in the cloud.
 */
function supabaseGet(endpoint, apiKey, ids) {
  return new Promise((resolve) => {
    if (!ids || ids.length === 0) {
      resolve({ ok: true, status: 200, rows: [] });
      return;
    }

    const queryUrl = `${endpoint}?id=in.(${ids.map(id => `"${id}"`).join(',')})`;
    const parsed = url.parse(queryUrl);

    const options = {
      hostname: parsed.hostname,
      path:     parsed.path,
      method:   'GET',
      headers: {
        'apikey':         apiKey,
        'Authorization':  `Bearer ${apiKey}`
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const rows = JSON.parse(body);
            resolve({ ok: true, status: res.statusCode, rows });
          } catch (e) {
            resolve({ ok: false, status: res.statusCode, body: 'JSON parse error' });
          }
        } else {
          resolve({ ok: false, status: res.statusCode, body });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ ok: false, status: 0, body: err.message });
    });

    req.setTimeout(15000, () => {
      req.destroy();
      resolve({ ok: false, status: 0, body: 'Request timed out' });
    });

    req.end();
  });
}

/**
 * Make a single HTTPS POST request and return the parsed response.
 */
function supabaseUpsert(endpoint, apiKey, rows) {
  return new Promise((resolve) => {
    if (!rows || rows.length === 0) {
      resolve({ ok: true, status: 204, body: '' });
      return;
    }

    const payload = JSON.stringify(rows);
    const parsed  = url.parse(endpoint);

    const options = {
      hostname: parsed.hostname,
      path:     parsed.path,
      method:   'POST',
      headers: {
        'Content-Type':  'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'apikey':         apiKey,
        'Authorization':  `Bearer ${apiKey}`,
        'Prefer':         'resolution=merge-duplicates'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body });
      });
    });

    req.on('error', (err) => {
      resolve({ ok: false, status: 0, body: err.message });
    });

    req.setTimeout(15000, () => {
      req.destroy();
      resolve({ ok: false, status: 0, body: 'Request timed out after 15 seconds.' });
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Fetch all records from a remote table.
 */
function supabaseFetchAll(endpoint, apiKey) {
  return new Promise((resolve) => {
    const parsed = url.parse(endpoint);

    const options = {
      hostname: parsed.hostname,
      path:     parsed.path,
      method:   'GET',
      headers: {
        'apikey':         apiKey,
        'Authorization':  `Bearer ${apiKey}`
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const rows = JSON.parse(body);
            resolve({ ok: true, status: res.statusCode, rows });
          } catch (e) {
            resolve({ ok: false, status: res.statusCode, body: 'JSON parse error' });
          }
        } else {
          resolve({ ok: false, status: res.statusCode, body });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ ok: false, status: 0, body: err.message });
    });

    req.setTimeout(15000, () => {
      req.destroy();
      resolve({ ok: false, status: 0, body: 'Request timed out' });
    });

    req.end();
  });
}

function supabaseGetSetting(baseUrl, apiKey, key) {
  return new Promise((resolve) => {
    const queryUrl = `${baseUrl}/rest/v1/settings?key=eq.${key}&select=value`;
    const parsed = url.parse(queryUrl);

    const options = {
      hostname: parsed.hostname,
      path:     parsed.path,
      method:   'GET',
      headers: {
        'apikey':         apiKey,
        'Authorization':  `Bearer ${apiKey}`
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const rows = JSON.parse(body);
            resolve({ ok: true, value: rows.length > 0 ? rows[0].value : null });
          } catch (e) {
            resolve({ ok: false, value: null, error: 'JSON parse error' });
          }
        } else {
          resolve({ ok: false, value: null, error: `HTTP ${res.statusCode}` });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ ok: false, value: null, error: err.message });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ ok: false, value: null, error: 'Timed out' });
    });

    req.end();
  });
}

const TABLES_CONFIG = [
  {
    localTable:    'students',
    remoteTable:   'students',
    onConflict:    'id',
    uniqueKeys:    ['id', 'roll_number'],
    selectQuery:   "SELECT id, name, roll_number, class, status, updated_at FROM students WHERE sync_status = 'pending'",
    markSynced:    "UPDATE students SET sync_status = 'synced' WHERE sync_status = 'pending'",
    mapRow:        (r) => ({ id: r.id, name: r.name, roll_number: r.roll_number, class: r.class, status: r.status, updated_at: r.updated_at })
  },
  {
    localTable:    'teachers_admins',
    remoteTable:   'teachers_admins',
    onConflict:    'id',
    uniqueKeys:    ['id', 'username'],
    selectQuery:   "SELECT id, username, password_hash, role, name, email, phone_number, employee_id, hire_date, assigned_classes_json, assigned_subjects_json, last_login, status, updated_at FROM teachers_admins WHERE sync_status = 'pending'",
    markSynced:    "UPDATE teachers_admins SET sync_status = 'synced' WHERE sync_status = 'pending'",
    mapRow:        (r) => ({
      id: r.id,
      username: r.username,
      password_hash: r.password_hash,
      role: r.role,
      name: r.name,
      email: r.email,
      phone_number: r.phone_number,
      employee_id: r.employee_id,
      hire_date: r.hire_date,
      assigned_classes_json: r.assigned_classes_json,
      assigned_subjects_json: r.assigned_subjects_json,
      last_login: r.last_login,
      status: r.status,
      updated_at: r.updated_at
    })
  },
  {
    localTable:    'classes',
    remoteTable:   'classes',
    onConflict:    'id',
    uniqueKeys:    ['id', 'name'],
    selectQuery:   "SELECT id, name, status, updated_at FROM classes WHERE sync_status = 'pending'",
    markSynced:    "UPDATE classes SET sync_status = 'synced' WHERE sync_status = 'pending'",
    mapRow:        (r) => ({ id: r.id, name: r.name, status: r.status, updated_at: r.updated_at })
  },
  {
    localTable:    'subjects',
    remoteTable:   'subjects',
    onConflict:    'id',
    uniqueKeys:    ['id', 'name'],
    selectQuery:   "SELECT id, name, status, updated_at FROM subjects WHERE sync_status = 'pending'",
    markSynced:    "UPDATE subjects SET sync_status = 'synced' WHERE sync_status = 'pending'",
    mapRow:        (r) => ({ id: r.id, name: r.name, status: r.status, updated_at: r.updated_at })
  },
  {
    localTable:    'question_bank',
    remoteTable:   'question_bank',
    onConflict:    'id',
    uniqueKeys:    ['id'],
    selectQuery:   "SELECT id, class, subject, text, audio_text, options_json, correct_answer, image_path, difficulty, approval_status, status, updated_at FROM question_bank WHERE sync_status = 'pending'",
    markSynced:    "UPDATE question_bank SET sync_status = 'synced' WHERE sync_status = 'pending'",
    mapRow:        (r) => ({ id: r.id, class: r.class, subject: r.subject, text: r.text, audio_text: r.audio_text, options_json: r.options_json, correct_answer: r.correct_answer, image_path: r.image_path, difficulty: r.difficulty, approval_status: r.approval_status, status: r.status, updated_at: r.updated_at })
  },
  {
    localTable:    'assessments',
    remoteTable:   'assessments',
    onConflict:    'id',
    uniqueKeys:    ['id'],
    selectQuery:   "SELECT id, student_id, score, total_questions, results_json, date, updated_at FROM assessments WHERE sync_status = 'pending'",
    markSynced:    "UPDATE assessments SET sync_status = 'synced' WHERE sync_status = 'pending'",
    mapRow:        (r) => ({ id: r.id, student_id: r.student_id, score: r.score, total_questions: r.total_questions, results_json: r.results_json, date: r.date, updated_at: r.updated_at })
  },
  {
    localTable:    'attendance',
    remoteTable:   'attendance',
    onConflict:    'type,target_id,date',
    uniqueKeys:    ['type', 'target_id', 'date'],
    selectQuery:   "SELECT id, type, target_id, date, status, updated_at FROM attendance WHERE sync_status = 'pending'",
    markSynced:    "UPDATE attendance SET sync_status = 'synced' WHERE sync_status = 'pending'",
    mapRow:        (r) => ({ id: r.id, type: r.type, target_id: r.target_id, date: r.date, status: r.status, updated_at: r.updated_at })
  },
  {
    localTable:    'audit_logs',
    remoteTable:   'audit_logs',
    onConflict:    'id',
    uniqueKeys:    ['id'],
    selectQuery:   "SELECT id, user_id, action, details, timestamp FROM audit_logs WHERE sync_status = 'pending'",
    markSynced:    "UPDATE audit_logs SET sync_status = 'synced' WHERE sync_status = 'pending'",
    mapRow:        (r) => ({ id: r.id, user_id: r.user_id, action: r.action, details: r.details, timestamp: r.timestamp })
  },
  {
    localTable:    'question_versions',
    remoteTable:   'question_versions',
    onConflict:    'id',
    uniqueKeys:    ['id'],
    selectQuery:   "SELECT id, question_id, class, subject, text, audio_text, options_json, correct_answer, difficulty, version_number, changed_by, updated_at FROM question_versions WHERE sync_status = 'pending'",
    markSynced:    "UPDATE question_versions SET sync_status = 'synced' WHERE sync_status = 'pending'",
    mapRow:        (r) => ({ id: r.id, question_id: r.question_id, class: r.class, subject: r.subject, text: r.text, audio_text: r.audio_text, options_json: r.options_json, correct_answer: r.correct_answer, difficulty: r.difficulty, version_number: r.version_number, changed_by: r.changed_by, updated_at: r.updated_at })
  },
  {
    localTable:    'student_tuition',
    remoteTable:   'student_tuition',
    onConflict:    'student_id',
    uniqueKeys:    ['student_id'],
    selectQuery:   "SELECT id, student_id, total_charged, amount_paid, updated_at FROM student_tuition WHERE sync_status = 'pending'",
    markSynced:    "UPDATE student_tuition SET sync_status = 'synced' WHERE sync_status = 'pending'",
    mapRow:        (r) => ({ id: r.id, student_id: r.student_id, total_charged: r.total_charged, amount_paid: r.amount_paid, updated_at: r.updated_at })
  },
  {
    localTable:    'tuition_payments',
    remoteTable:   'tuition_payments',
    onConflict:    'id',
    uniqueKeys:    ['id'],
    selectQuery:   "SELECT id, student_id, amount, payment_date, payment_method, notes, updated_at FROM tuition_payments WHERE sync_status = 'pending'",
    markSynced:    "UPDATE tuition_payments SET sync_status = 'synced' WHERE sync_status = 'pending'",
    mapRow:        (r) => ({ id: r.id, student_id: r.student_id, amount: r.amount, payment_date: r.payment_date, payment_method: r.payment_method, notes: r.notes, updated_at: r.updated_at })
  }
];

function getRowDisplayName(table, row) {
  if (table === 'students' || table === 'teachers_admins' || table === 'classes' || table === 'subjects') {
    return row.name || row.username || row.id;
  }
  if (table === 'question_bank') {
    return row.text ? (row.text.length > 50 ? row.text.substring(0, 50) + '...' : row.text) : row.id;
  }
  if (table === 'assessments') {
    return `Assessment (Score: ${row.score}/${row.total_questions})`;
  }
  if (table === 'attendance') {
    return `Attendance Roll (Date: ${row.date})`;
  }
  if (table === 'audit_logs') {
    return `Audit: ${row.action} - ${row.details}`;
  }
  if (table === 'question_versions') {
    return `Question Version ${row.version_number}`;
  }
  if (table === 'student_tuition') {
    return `Tuition Summary (Charged: ${row.total_charged})`;
  }
  if (table === 'tuition_payments') {
    return `Tuition Payment (${row.amount})`;
  }
  return row.id;
}

function parseTimestamp(ts) {
  if (ts === null || ts === undefined || ts === '') return 0;
  if (typeof ts === 'number') return ts;
  const num = Number(ts);
  if (!isNaN(num)) return num;
  const parsed = Date.parse(ts);
  return isNaN(parsed) ? 0 : parsed;
}

function rowsDiffer(cfg, localRow, remoteRow) {
  const mappedLocal = cfg.mapRow(localRow);
  for (const key of Object.keys(mappedLocal)) {
    if (key === 'updated_at') continue;
    
    let localVal = mappedLocal[key];
    let remoteVal = remoteRow[key];
    
    if (localVal === undefined || localVal === null) localVal = '';
    if (remoteVal === undefined || remoteVal === null) remoteVal = '';
    
    if (key === 'options_json' || key === 'results_json') {
      try {
        if (JSON.stringify(JSON.parse(localVal)) !== JSON.stringify(JSON.parse(remoteVal))) {
          return true;
        }
        continue;
      } catch (_) {}
    }
    
    if (String(localVal) !== String(remoteVal)) {
      return true;
    }
  }
  return false;
}

/**
 * Push all pending records from the local SQLite database to Supabase.
 */
async function pushPendingRecords(db, projectUrl, apiKey, force = false) {
  if (!projectUrl || !apiKey) {
    return { success: false, syncedCount: 0, errors: ['Cloud sync is not configured.'] };
  }

  const baseUrl = projectUrl.replace(/\/$/, '');
  let totalSynced = 0;
  const errors = [];
  const conflicts = [];

  // 1. Conflict Check Phase
  if (!force) {
    for (const cfg of TABLES_CONFIG) {
      try {
        const localRows = db.prepare(cfg.selectQuery).all();
        if (localRows.length === 0) continue;

        const ids = localRows.map(r => r.id);
        const endpoint = `${baseUrl}/rest/v1/${cfg.remoteTable}`;
        const result = await supabaseGet(endpoint, apiKey, ids);

        if (result.ok && result.rows) {
          for (const localRow of localRows) {
            const remoteRow = result.rows.find(r => r.id === localRow.id);
            if (remoteRow) {
              if (rowsDiffer(cfg, localRow, remoteRow)) {
                conflicts.push({
                  table: cfg.localTable,
                  id: localRow.id,
                  displayName: getRowDisplayName(cfg.localTable, localRow),
                  localUpdatedAt: localRow.updated_at,
                  remoteUpdatedAt: remoteRow.updated_at
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('[syncHelper] Error during conflict check:', err);
      }
    }

    if (conflicts.length > 0) {
      return {
        success: false,
        hasConflicts: true,
        conflicts,
        syncedCount: 0,
        errors: ['Conflicts detected with the cloud database.']
      };
    }
  }

  // 2. Upsert Phase
  for (const cfg of TABLES_CONFIG) {
    try {
      const rows = db.prepare(cfg.selectQuery).all();
      if (rows.length === 0) continue;

      let payload = rows.map(cfg.mapRow);
      let urlParams = '';
      if (cfg.onConflict) {
        urlParams = `?on_conflict=${cfg.onConflict}`;
      }
      const endpoint = `${baseUrl}/rest/v1/${cfg.remoteTable}${urlParams}`;
      let result = await supabaseUpsert(endpoint, apiKey, payload);

      // Auto-heal schema mismatches if remote table is missing a column (PGRST204).
      // Strip the offending column and retry silently — only surface an error if the
      // SECOND attempt also fails.
      if (!result.ok && result.status === 400 && result.body && result.body.includes('PGRST204')) {
        const match = result.body.match(/Could not find the ['"]([^'"]+)['"] column/i);
        if (match && match[1]) {
          const missingCol = match[1];
          console.warn(`[syncHelper] Remote table '${cfg.remoteTable}' missing column '${missingCol}'. Stripping and retrying silently...`);
          payload = payload.map(r => {
            const copy = { ...r };
            delete copy[missingCol];
            return copy;
          });
          result = await supabaseUpsert(endpoint, apiKey, payload);
          // Only report error if the retry also failed
          if (!result.ok) {
            const errMsg = `${cfg.remoteTable}: HTTP ${result.status} — ${result.body.substring(0, 200)}`;
            errors.push(errMsg);
            console.error('[syncHelper] Auto-heal retry also failed:', errMsg);
          } else {
            console.log(`[syncHelper] Auto-heal succeeded for '${cfg.remoteTable}' (stripped '${missingCol}')`);
          }
        } else {
          // PGRST204 but no column name matched — report as error
          const errMsg = `${cfg.remoteTable}: HTTP ${result.status} — ${result.body.substring(0, 200)}`;
          errors.push(errMsg);
          console.error('[syncHelper] Upsert error (PGRST204, no column match):', errMsg);
        }
      } else if (!result.ok) {
        const errMsg = `${cfg.remoteTable}: HTTP ${result.status} — ${result.body.substring(0, 200)}`;
        errors.push(errMsg);
        console.error('[syncHelper] Upsert error:', errMsg);
      }

      if (result.ok) {
        db.prepare(cfg.markSynced).run();
        totalSynced += rows.length;
      }
    } catch (err) {
      const errMsg = `${cfg.remoteTable}: ${err.message}`;
      errors.push(errMsg);
      console.error('[syncHelper] Unexpected error:', errMsg);
    }
  }

  // 2.5. Pull Phase — download all records from cloud and merge into local DB.
  //
  // Safety rules to prevent data reversion:
  //   A. If a local row has sync_status = 'pending', skip it — it has unsent local changes.
  //   B. If the local row's updated_at >= the remote row's updated_at, skip — local is
  //      at least as fresh. This prevents a freshly-pushed row being immediately overwritten
  //      by the cloud's copy (which may lag behind by milliseconds in propagation).
  //   C. If a remote row has status = 'deleted' and does NOT exist locally, do NOT insert
  //      it — this prevents ghost re-insertion of students/records that were deleted locally
  //      and already pushed.
  for (const cfg of TABLES_CONFIG) {
    try {
      const endpoint = `${baseUrl}/rest/v1/${cfg.remoteTable}`;
      const fetchResult = await supabaseFetchAll(endpoint, apiKey);
      if (fetchResult.ok && fetchResult.rows) {
        const tableInfo = db.prepare(`PRAGMA table_info(${cfg.localTable})`).all();
        const validColumns = new Set(tableInfo.map(c => c.name));

        const insertOrUpdate = db.transaction((rows) => {
          let pulledCount = 0;
          for (const remoteRow of rows) {
            const filteredRow = {};
            for (const key of Object.keys(remoteRow)) {
              if (validColumns.has(key)) {
                let val = remoteRow[key];
                if (val !== null && typeof val === 'object') {
                  val = JSON.stringify(val);
                }
                filteredRow[key] = val;
              }
            }

            let localRow = null;
            let idMismatchedRow = null;

            const selectCols = validColumns.has('updated_at') ? 'sync_status, updated_at' : 'sync_status';
            localRow = db.prepare(`SELECT ${selectCols} FROM ${cfg.localTable} WHERE id = ?`).get(filteredRow.id);

            // Alternate unique keys mismatch healing
            if (!localRow && cfg.uniqueKeys) {
              const clauses = cfg.uniqueKeys.map(k => `${k} = ?`).join(' AND ');
              const params = cfg.uniqueKeys.map(k => filteredRow[k]);
              const selectMismatchedCols = validColumns.has('updated_at') ? 'id, sync_status, updated_at' : 'id, sync_status';
              idMismatchedRow = db.prepare(`SELECT ${selectMismatchedCols} FROM ${cfg.localTable} WHERE ${clauses}`).get(...params);
              
              if (idMismatchedRow) {
                // Heals the local ID mismatch: update local ID to remote ID
                db.prepare(`UPDATE ${cfg.localTable} SET id = ? WHERE id = ?`).run(filteredRow.id, idMismatchedRow.id);
                localRow = db.prepare(`SELECT ${selectCols} FROM ${cfg.localTable} WHERE id = ?`).get(filteredRow.id);
              }
            }

            if (!localRow) {
              // SAFETY RULE C: Do NOT re-insert a remotely-deleted row that doesn't exist
              // locally. This prevents ghost resurrection of deleted students/records.
              if (filteredRow.status === 'deleted') {
                console.log(`[syncHelper] Skipping remote-deleted row ${filteredRow.id} (${cfg.localTable}) — not inserting ghost.`);
                continue;
              }

              if (cfg.localTable === 'teachers_admins' && (filteredRow.password_hash === undefined || filteredRow.password_hash === null)) {
                const cryptoHelper = require('./cryptoHelper.cjs');
                filteredRow.password_hash = cryptoHelper.hashPassword('wisdom123');
              }
              const keys = Object.keys(filteredRow);
              const columns = [...keys, 'sync_status'];
              const placeholders = columns.map(() => '?').join(', ');
              const values = [...keys.map(k => filteredRow[k]), 'synced'];

              db.prepare(`
                INSERT INTO ${cfg.localTable} (${columns.join(', ')})
                VALUES (${placeholders})
              `).run(...values);
              pulledCount++;
            } else {
              // SAFETY RULE A: Skip rows with pending local changes.
              if (localRow.sync_status === 'pending') {
                console.log(`[syncHelper] Skipping pull for ${cfg.localTable} id=${filteredRow.id} — local has pending changes.`);
                continue;
              }

              if (cfg.localTable === 'audit_logs') {
                continue;
              }

              const hasUpdatedAt = filteredRow.updated_at !== undefined && filteredRow.updated_at !== null;
              const remoteTime = parseTimestamp(filteredRow.updated_at);
              const localTime  = parseTimestamp(localRow.updated_at);

              // SAFETY RULE B: Only overwrite if remote is strictly newer than local.
              // Using strict > (not >=) prevents overwriting a row that was just pushed
              // (same timestamp) or is locally newer.
              const shouldUpdate = hasUpdatedAt ? remoteTime > localTime : true;

              if (shouldUpdate) {
                if (cfg.localTable === 'teachers_admins' && (filteredRow.password_hash === undefined || filteredRow.password_hash === null)) {
                  delete filteredRow.password_hash;
                }
                const keys = Object.keys(filteredRow).filter(k => k !== 'id');
                if (keys.length === 0) continue;
                const setClause = keys.map(k => `${k} = ?`).join(', ');
                const values = [...keys.map(k => filteredRow[k]), 'synced', filteredRow.id];

                db.prepare(`
                  UPDATE ${cfg.localTable}
                  SET ${setClause}, sync_status = ?
                  WHERE id = ?
                `).run(...values);
                pulledCount++;
              }
            }
          }
          return pulledCount;
        });

        const merged = insertOrUpdate(fetchResult.rows);
        console.log(`[syncHelper] Pulled ${merged} records from remote ${cfg.remoteTable}`);
      } else {
        const errMsg = `Pull ${cfg.remoteTable}: HTTP ${fetchResult.status} — ${fetchResult.body ? fetchResult.body.substring(0, 200) : 'unknown error'}`;
        errors.push(errMsg);
        console.error('[syncHelper] Pull error:', errMsg);
      }
    } catch (err) {
      const errMsg = `Pull ${cfg.remoteTable}: ${err.message}`;
      errors.push(errMsg);
      console.error('[syncHelper] Pull unexpected error:', errMsg);
    }
  }

  // 3. Pull School Branding / Logo phase
  try {
    const logoResult = await supabaseGetSetting(baseUrl, apiKey, 'school_logo');
    if (logoResult.ok) {
      if (logoResult.value !== undefined) {
        db.prepare(`
          INSERT INTO settings (key, value)
          VALUES ('school_logo', ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `).run(logoResult.value || '');
      }
    } else {
      console.warn('[syncHelper] Settings table logo fetch failed or table not initialized:', logoResult.error);
    }
  } catch (err) {
    console.error('[syncHelper] Error pulling logo setting:', err);
  }

  // Pull school-wide currency setting
  try {
    const currencyResult = await supabaseGetSetting(baseUrl, apiKey, 'currency');
    if (currencyResult.ok && currencyResult.value) {
      db.prepare(`
        INSERT INTO settings (key, value)
        VALUES ('currency', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run(currencyResult.value);
    }
  } catch (err) {
    console.error('[syncHelper] Error pulling currency setting:', err);
  }

  // Log the sync attempt
  try {
    const crypto = require('crypto');
    db.prepare("INSERT INTO sync_log (id, sync_time, status, changes_synced) VALUES (?, ?, ?, ?)")
      .run(crypto.randomUUID(), Date.now(), errors.length === 0 ? 'success' : 'partial', totalSynced);
  } catch (_) {}

  return {
    success: errors.length === 0,
    syncedCount: totalSynced,
    errors
  };
}

async function pushSettingToCloud(projectUrl, apiKey, key, value) {
  try {
    const baseUrl = projectUrl.replace(/\/$/, '');
    const endpoint = `${baseUrl}/rest/v1/settings?on_conflict=key`;
    const payload = [{ key, value }];
    const result = await supabaseUpsert(endpoint, apiKey, payload);
    return result.ok;
  } catch (err) {
    console.error('[syncHelper] pushSettingToCloud error:', err.message);
    return false;
  }
}

/**
 * Resolve conflicts by keeping cloud version of the specified records ("Overwrite Local").
 * The local row is updated with the remote data and marked 'synced'.
 */
async function resolveConflictsWithCloud(db, projectUrl, apiKey, conflicts) {
  if (!projectUrl || !apiKey || !conflicts || conflicts.length === 0) {
    return { success: true };
  }

  const baseUrl = projectUrl.replace(/\/$/, '');

  for (const conflict of conflicts) {
    const cfg = TABLES_CONFIG.find(c => c.localTable === conflict.table);
    if (!cfg) continue;

    try {
      const endpoint = `${baseUrl}/rest/v1/${cfg.remoteTable}`;
      const result = await supabaseGet(endpoint, apiKey, [conflict.id]);

      if (result.ok && result.rows && result.rows.length > 0) {
        const remoteRow = result.rows[0];
        const mappedRemote = cfg.mapRow(remoteRow);

        // Protect password_hash from being nulled out on teachers_admins
        if (cfg.localTable === 'teachers_admins' && (mappedRemote.password_hash === undefined || mappedRemote.password_hash === null)) {
          delete mappedRemote.password_hash;
        }

        const keys = Object.keys(mappedRemote).filter(k => k !== 'id');
        const setClauses = keys.map(k => `${k} = ?`).join(', ');
        const values = [...keys.map(k => mappedRemote[k]), 'synced', conflict.id];

        const sql = `UPDATE ${cfg.localTable} SET ${setClauses}, sync_status = ? WHERE id = ?`;
        db.prepare(sql).run(...values);
      }
    } catch (err) {
      console.error(`[syncHelper] Error resolving conflict for ${conflict.table} ID ${conflict.id}:`, err);
      return { success: false, error: err.message };
    }
  }

  return { success: true };
}

/**
 * Resolve conflicts by keeping the LOCAL version ("Overwrite Cloud").
 * Mark each conflicted row as 'pending' with a bumped updated_at so:
 *   1. The follow-on push phase will pick it up and send it to cloud.
 *   2. The Pull Phase will skip it (pending rule A) and won't overwrite it back.
 */
function resolveConflictsKeepLocal(db, conflicts) {
  if (!conflicts || conflicts.length === 0) return { success: true };

  try {
    const now = Date.now();
    for (const conflict of conflicts) {
      const cfg = TABLES_CONFIG.find(c => c.localTable === conflict.table);
      if (!cfg) continue;

      // Bump updated_at and mark pending so the push phase sends this row
      // and the Pull Phase won't re-overwrite it (pending rule A).
      db.prepare(`
        UPDATE ${conflict.table}
        SET sync_status = 'pending', updated_at = ?
        WHERE id = ?
      `).run(now, conflict.id);
      console.log(`[syncHelper] Marked ${conflict.table} id=${conflict.id} as pending for "Overwrite Cloud" resolution.`);
    }
    return { success: true };
  } catch (err) {
    console.error('[syncHelper] resolveConflictsKeepLocal error:', err);
    return { success: false, error: err.message };
  }
}

module.exports = { pushPendingRecords, resolveConflictsWithCloud, resolveConflictsKeepLocal, supabaseGet, pushSettingToCloud };

