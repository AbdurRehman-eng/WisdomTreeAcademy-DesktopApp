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

const TABLES_CONFIG = [
  {
    localTable:    'students',
    remoteTable:   'students',
    selectQuery:   "SELECT id, name, roll_number, class, status, updated_at FROM students WHERE sync_status = 'pending'",
    markSynced:    "UPDATE students SET sync_status = 'synced' WHERE sync_status = 'pending'",
    mapRow:        (r) => ({ id: r.id, name: r.name, roll_number: r.roll_number, class: r.class, status: r.status, updated_at: r.updated_at })
  },
  {
    localTable:    'teachers_admins',
    remoteTable:   'teachers_admins',
    selectQuery:   "SELECT id, username, role, name, email, status, updated_at FROM teachers_admins WHERE sync_status = 'pending'",
    markSynced:    "UPDATE teachers_admins SET sync_status = 'synced' WHERE sync_status = 'pending'",
    mapRow:        (r) => ({ id: r.id, username: r.username, role: r.role, name: r.name, email: r.email, status: r.status, updated_at: r.updated_at })
  },
  {
    localTable:    'classes',
    remoteTable:   'classes',
    selectQuery:   "SELECT id, name, status, updated_at FROM classes WHERE sync_status = 'pending'",
    markSynced:    "UPDATE classes SET sync_status = 'synced' WHERE sync_status = 'pending'",
    mapRow:        (r) => ({ id: r.id, name: r.name, status: r.status, updated_at: r.updated_at })
  },
  {
    localTable:    'subjects',
    remoteTable:   'subjects',
    selectQuery:   "SELECT id, name, status, updated_at FROM subjects WHERE sync_status = 'pending'",
    markSynced:    "UPDATE subjects SET sync_status = 'synced' WHERE sync_status = 'pending'",
    mapRow:        (r) => ({ id: r.id, name: r.name, status: r.status, updated_at: r.updated_at })
  },
  {
    localTable:    'question_bank',
    remoteTable:   'question_bank',
    selectQuery:   "SELECT id, class, subject, text, audio_text, options_json, correct_answer, image_path, status, updated_at FROM question_bank WHERE sync_status = 'pending'",
    markSynced:    "UPDATE question_bank SET sync_status = 'synced' WHERE sync_status = 'pending'",
    mapRow:        (r) => ({ id: r.id, class: r.class, subject: r.subject, text: r.text, audio_text: r.audio_text, options_json: r.options_json, correct_answer: r.correct_answer, image_path: r.image_path, status: r.status, updated_at: r.updated_at })
  },
  {
    localTable:    'assessments',
    remoteTable:   'assessments',
    selectQuery:   "SELECT id, student_id, score, total_questions, results_json, date, updated_at FROM assessments WHERE sync_status = 'pending'",
    markSynced:    "UPDATE assessments SET sync_status = 'synced' WHERE sync_status = 'pending'",
    mapRow:        (r) => ({ id: r.id, student_id: r.student_id, score: r.score, total_questions: r.total_questions, results_json: r.results_json, date: r.date, updated_at: r.updated_at })
  },
  {
    localTable:    'attendance',
    remoteTable:   'attendance',
    selectQuery:   "SELECT id, type, target_id, date, status, updated_at FROM attendance WHERE sync_status = 'pending'",
    markSynced:    "UPDATE attendance SET sync_status = 'synced' WHERE sync_status = 'pending'",
    mapRow:        (r) => ({ id: r.id, type: r.type, target_id: r.target_id, date: r.date, status: r.status, updated_at: r.updated_at })
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
  return row.id;
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

      const payload  = rows.map(cfg.mapRow);
      const endpoint = `${baseUrl}/rest/v1/${cfg.remoteTable}`;
      const result   = await supabaseUpsert(endpoint, apiKey, payload);

      if (result.ok) {
        db.prepare(cfg.markSynced).run();
        totalSynced += rows.length;
      } else {
        const errMsg = `${cfg.remoteTable}: HTTP ${result.status} — ${result.body.substring(0, 200)}`;
        errors.push(errMsg);
        console.error('[syncHelper] Upsert error:', errMsg);
      }
    } catch (err) {
      const errMsg = `${cfg.remoteTable}: ${err.message}`;
      errors.push(errMsg);
      console.error('[syncHelper] Unexpected error:', errMsg);
    }
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

module.exports = { pushPendingRecords };
