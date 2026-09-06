const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database(':memory:');

// Load schema
const schemaSql = fs.readFileSync('./db/schema.sql', 'utf8');
db.exec(schemaSql);

// Run migration
try {
  db.prepare("ALTER TABLE question_bank ADD COLUMN image_path TEXT").run();
} catch (e) {}

console.log("Schema loaded successfully.");

// Seed initial admin as pending
const now = Date.now();
db.prepare(`
  INSERT INTO teachers_admins (id, username, password_hash, role, name, email, sync_status, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
`).run('A1', 'admin', 'some_local_hash', 'admin', 'System Administrator', 'admin@wisdomtree.edu', now);

console.log("Seeded pending teachers_admins row.");

const { resolveConflictsWithCloud, pushPendingRecords } = require('./utils/syncHelper.cjs');

// Mock remote response for resolveConflictsWithCloud (Supabase GET)
const https = require('https');
const originalRequest = https.request;

function mockGetResponse(rows) {
  https.request = function (options, callback) {
    const mockResponse = {
      statusCode: 200,
      on: (event, cb) => {
        if (event === 'data') cb(JSON.stringify(rows));
        if (event === 'end') cb();
      }
    };
    callback(mockResponse);
    return { on: () => {}, setTimeout: () => {}, end: () => {} };
  };
}

async function run() {
  console.log("\n1. Running resolveConflictsWithCloud...");
  mockGetResponse([{
    id: 'A1',
    username: 'admin',
    password_hash: null,
    role: 'admin',
    name: 'System Administrator (Remote)',
    email: 'admin@wisdomtree.edu',
    status: 'active',
    updated_at: now + 1000
  }]);

  const conflicts = [{ table: 'teachers_admins', id: 'A1' }];
  const res1 = await resolveConflictsWithCloud(db, 'https://example.supabase.co', 'dummy-key', conflicts);
  console.log("resolveConflictsWithCloud result:", res1);

  let row = db.prepare("SELECT id, sync_status, updated_at FROM teachers_admins WHERE id = 'A1'").get();
  console.log("Row after resolveConflictsWithCloud:", row);

  console.log("\n2. Running pushPendingRecords immediately after...");
  // Mock empty/success response for upserts/pulls
  https.request = function (options, callback) {
    const mockResponse = {
      statusCode: 200,
      on: (event, cb) => {
        if (event === 'data') cb(JSON.stringify([]));
        if (event === 'end') cb();
      }
    };
    callback(mockResponse);
    return { on: () => {}, setTimeout: () => {}, end: () => {} };
  };

  const res2 = await pushPendingRecords(db, 'https://example.supabase.co', 'dummy-key', false);
  console.log("pushPendingRecords result:", res2);

  row = db.prepare("SELECT id, sync_status, updated_at FROM teachers_admins WHERE id = 'A1'").get();
  console.log("Row after pushPendingRecords:", row);

  // Check pending counts
  const pendingTeachers = db.prepare("SELECT count(*) as count FROM teachers_admins WHERE sync_status = 'pending'").get().count;
  console.log(`\nFinal Pending Teachers: ${pendingTeachers}`);
  
  process.exit(0);
}

run().then(() => {
  https.request = originalRequest;
});
