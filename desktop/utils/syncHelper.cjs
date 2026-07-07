/**
 * syncHelper.cjs
 *
 * Handles real cloud synchronization by pushing locally-pending SQLite rows
 * to a configured Supabase project via the REST API (upsert).
 *
 * Sync direction in V1: LOCAL → CLOUD (push only).
 * Pull sync (cloud → local) is planned for V2.
 *
 * Supabase REST upsert endpoint:
 *   POST https://<project>.supabase.co/rest/v1/<table>
 *   Headers: apikey, Authorization, Prefer: resolution=merge-duplicates
 */

const https = require('https');
const url   = require('url');

/**
 * Make a single HTTPS POST request and return the parsed response.
 * @param {string} endpoint   Full URL
 * @param {string} apiKey     Supabase anon key
 * @param {Array}  rows       Array of plain objects to upsert
 * @returns {Promise<{ ok: boolean, status: number, body: string }>}
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
 * TABLES_CONFIG defines how each local SQLite table maps to a Supabase REST endpoint
 * and which columns to include in the payload.
 */
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
    selectQuery:   "SELECT id, class, subject, text, audio_text, options_json, correct_answer, status, updated_at FROM question_bank WHERE sync_status = 'pending'",
    markSynced:    "UPDATE question_bank SET sync_status = 'synced' WHERE sync_status = 'pending'",
    mapRow:        (r) => ({ id: r.id, class: r.class, subject: r.subject, text: r.text, audio_text: r.audio_text, options_json: r.options_json, correct_answer: r.correct_answer, status: r.status, updated_at: r.updated_at })
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

/**
 * Push all pending records from the local SQLite database to Supabase.
 *
 * @param {import('better-sqlite3').Database} db         - Open SQLite database instance
 * @param {string}                             projectUrl - Supabase project URL (e.g. https://xyz.supabase.co)
 * @param {string}                             apiKey     - Supabase anon/service key
 * @returns {Promise<{ success: boolean, syncedCount: number, errors: string[] }>}
 */
async function pushPendingRecords(db, projectUrl, apiKey) {
  if (!projectUrl || !apiKey) {
    return { success: false, syncedCount: 0, errors: ['Cloud sync is not configured. Please enter your Supabase URL and API key in Sync & Settings.'] };
  }

  // Normalise URL — strip trailing slash
  const baseUrl = projectUrl.replace(/\/$/, '');

  let totalSynced = 0;
  const errors = [];

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

  // Log the sync attempt to the local sync_log table
  try {
    const crypto = require('crypto');
    db.prepare("INSERT INTO sync_log (id, sync_time, status, changes_synced) VALUES (?, ?, ?, ?)")
      .run(crypto.randomUUID(), Date.now(), errors.length === 0 ? 'success' : 'partial', totalSynced);
  } catch (_) { /* non-critical */ }

  return {
    success:     errors.length === 0,
    syncedCount: totalSynced,
    errors
  };
}

module.exports = { pushPendingRecords };
