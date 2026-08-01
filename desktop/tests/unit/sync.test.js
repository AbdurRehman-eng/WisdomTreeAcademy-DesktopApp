import { describe, it, expect, vi } from 'vitest';
import Database from 'better-sqlite3';
const { resolveConflictsWithCloud } = require('../../utils/syncHelper.cjs');
const https = require('https');

vi.mock('https');

// Mock better-sqlite3 to run consistently in standard Node environments without needing compiled binaries
vi.mock('better-sqlite3', () => {
  return {
    default: class MockDatabase {
      constructor() {
        this.runCalls = [];
      }
      exec() {}
      prepare(sql) {
        return {
          run: (...args) => {
            this.runCalls.push({ sql, args });
            return { changes: 1 };
          }
        };
      }
    }
  };
});

describe('Sync Conflict Resolution Tests', () => {
  it('should resolve conflicts by inserting/updating local records and marking synced', async () => {
    const db = new Database(':memory:');

    const mockRemoteRecord = {
      id: 'S101',
      name: 'Remote Name',
      roll_number: 'WTA-101',
      class: 'Nursery',
      status: 'active',
      updated_at: 2000
    };

    const mockResponse = {
      statusCode: 200,
      on: (event, cb) => {
        if (event === 'data') {
          cb(JSON.stringify([mockRemoteRecord]));
        }
        if (event === 'end') {
          cb();
        }
      }
    };

    const mockRequest = {
      on: vi.fn(),
      setTimeout: vi.fn(),
      end: vi.fn()
    };

    https.request = vi.fn().mockImplementation((options, callback) => {
      callback(mockResponse);
      return mockRequest;
    });

    const conflicts = [
      {
        table: 'students',
        id: 'S101',
        displayName: 'Student',
        localUpdatedAt: 1000,
        remoteUpdatedAt: 2000
      }
    ];

    const result = await resolveConflictsWithCloud(db, 'https://example.supabase.co', 'dummy-key', conflicts);

    expect(result.success).toBe(true);

    // Verify SQL prepared statement and correct values are passed to local database run
    expect(db.runCalls.length).toBe(1);
    const call = db.runCalls[0];
    expect(call.sql).toContain('UPDATE students SET');
    expect(call.sql).toContain('sync_status = ?');
    expect(call.args).toContain('Remote Name');
    expect(call.args).toContain('synced');
    expect(call.args).toContain('S101');
  });
});
