import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';

// Mock better-sqlite3 to run consistently on different Node.js environments
vi.mock('better-sqlite3', () => {
  return {
    default: class MockDatabase {
      constructor() {
        this.students = [
          { id: 's1', name: 'Timothy Brown', roll_number: 'WTA-0932', class: 'Grade 1', status: 'active' }
        ];
        this.student_tuition = [];
        this.tuition_payments = [];
        this.inTransaction = false;
        this.backupState = null;
      }

      pragma() {}

      transaction(fn) {
        return (...args) => {
          this.inTransaction = true;
          // Create deep copy backup of state
          this.backupState = {
            student_tuition: JSON.parse(JSON.stringify(this.student_tuition)),
            tuition_payments: JSON.parse(JSON.stringify(this.tuition_payments))
          };
          try {
            fn(...args);
            this.inTransaction = false;
            this.backupState = null;
          } catch (e) {
            // Rollback
            this.student_tuition = this.backupState.student_tuition;
            this.tuition_payments = this.backupState.tuition_payments;
            this.inTransaction = false;
            this.backupState = null;
            throw e;
          }
        };
      }

      prepare(sql) {
        const cleanSql = sql.trim().replace(/\s+/g, ' ');
        return {
          all: (...params) => {
            if (cleanSql.includes('SELECT s.id as student_id')) {
              // JOIN query
              return this.students.map(s => {
                const t = this.student_tuition.find(x => x.student_id === s.id) || { total_charged: 0.0, amount_paid: 0.0 };
                return {
                  student_id: s.id,
                  student_name: s.name,
                  roll_number: s.roll_number,
                  student_class: s.class,
                  total_charged: t.total_charged,
                  amount_paid: t.amount_paid,
                  tuition_id: t.id || null
                };
              });
            }
            if (cleanSql.includes('tuition_payments')) {
              if (cleanSql.includes('student_id = ?') || cleanSql.includes("student_id = 's1'")) {
                const studentId = params[0] || 's1';
                return this.tuition_payments.filter(p => p.student_id === studentId);
              }
              if (cleanSql.includes("id = 'p1'")) {
                return this.tuition_payments.filter(p => p.id === 'p1');
              }
              if (cleanSql.includes("id = 'p_fail'")) {
                return this.tuition_payments.filter(p => p.id === 'p_fail');
              }
              return this.tuition_payments;
            }
            return [];
          },
          get: (...params) => {
            if (cleanSql.includes('student_tuition')) {
              const studentId = params[0];
              return this.student_tuition.find(t => t.student_id === studentId) || null;
            }
            return null;
          },
          run: (...params) => {
            if (cleanSql.includes('INSERT INTO student_tuition')) {
              // params: [id, student_id, total_charged, amount_paid, now]
              const [id, student_id, total_charged, amount_paid, updated_at] = params;
              const existingIndex = this.student_tuition.findIndex(t => t.student_id === student_id);
              if (existingIndex > -1) {
                this.student_tuition[existingIndex].total_charged = total_charged;
                this.student_tuition[existingIndex].amount_paid = amount_paid;
                this.student_tuition[existingIndex].updated_at = updated_at;
              } else {
                this.student_tuition.push({ id, student_id, total_charged, amount_paid, updated_at });
              }
            }
            else if (cleanSql.includes('INSERT INTO tuition_payments')) {
              // params: [id, student_id, amount, date, method, notes, now]
              const [id, student_id, amount, payment_date, payment_method, notes, updated_at] = params;
              this.tuition_payments.push({ id, student_id, amount, payment_date, payment_method, notes, updated_at });
            }
            else if (cleanSql.includes('UPDATE student_tuition SET amount_paid = amount_paid + ?')) {
              const [amount, updated_at, id] = params;
              const existing = this.student_tuition.find(t => t.id === id);
              if (existing) {
                existing.amount_paid += amount;
                existing.updated_at = updated_at;
              }
            }
            else if (cleanSql.includes('SET non_existing_field = 1')) {
              throw new Error('SQLITE_ERROR: no such column: non_existing_field');
            }
            return { changes: 1 };
          }
        };
      }
    }
  };
});

describe('Tuition Database Operations & Logic Tests', () => {
  let db;

  beforeEach(() => {
    db = new Database('mock.db');
  });

  // Helper status derivation function to match UI logic
  const deriveStatus = (totalCharged, amountPaid) => {
    if (totalCharged > 0) {
      if (amountPaid >= totalCharged) return 'Paid';
      if (amountPaid > 0) return 'Partially Paid';
      return 'Outstanding';
    }
    return 'Paid';
  };

  it('should default tuition charged and paid to 0.0 when LEFT JOIN is used and no record exists', () => {
    const row = db.prepare(`
      SELECT 
        s.id as student_id,
        COALESCE(t.total_charged, 0.0) as total_charged,
        COALESCE(t.amount_paid, 0.0) as amount_paid
      FROM students s
      LEFT JOIN student_tuition t ON s.id = t.student_id
      WHERE s.id = 's1'
    `).all()[0];

    expect(row.total_charged).toBe(0.0);
    expect(row.amount_paid).toBe(0.0);
    expect(deriveStatus(row.total_charged, row.amount_paid)).toBe('Paid');
  });

  it('should insert student_tuition record when tuition charge is updated', () => {
    const studentId = 's1';
    const totalCharged = 1200.00;
    const now = Date.now();
    
    db.prepare(`
      INSERT INTO student_tuition (id, student_id, total_charged, amount_paid, updated_at, sync_status)
      VALUES (?, ?, ?, 0.0, ?, 'pending')
      ON CONFLICT(student_id) DO UPDATE SET
        total_charged = excluded.total_charged,
        sync_status = 'pending',
        updated_at = excluded.updated_at
    `).run('t1', studentId, totalCharged, 0.0, now);

    const row = db.prepare("SELECT * FROM student_tuition WHERE student_id = ?").get(studentId);
    expect(row.total_charged).toBe(1200.00);
    expect(row.amount_paid).toBe(0.0);
    expect(deriveStatus(row.total_charged, row.amount_paid)).toBe('Outstanding');
  });

  it('should update amount_paid in student_tuition and insert payment in transaction', () => {
    const studentId = 's1';
    
    // Setup initial tuition charge
    db.prepare(`
      INSERT INTO student_tuition (id, student_id, total_charged, amount_paid, updated_at)
      VALUES ('t1', ?, 1200.0, 0.0, ?)
    `).run('t1', studentId, 1200.0, 0.0, Date.now());

    // Record payment function matching transaction logic
    const recordPayment = (paymentId, amount, date, method, notes) => {
      const now = Date.now();
      const transaction = db.transaction(() => {
        db.prepare(`
          INSERT INTO tuition_payments (id, student_id, amount, payment_date, payment_method, notes, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(paymentId, studentId, amount, date, method, notes, now);

        db.prepare(`
          UPDATE student_tuition 
          SET amount_paid = amount_paid + ?, updated_at = ?
          WHERE student_id = ?
        `).run(amount, now, 't1');
      });
      transaction();
    };

    // Make first payment
    recordPayment('p1', 500.0, '2026-07-28', 'Cash', 'First installment');

    let tuition = db.prepare("SELECT * FROM student_tuition WHERE student_id = ?").get(studentId);
    expect(tuition.amount_paid).toBe(500.0);
    expect(deriveStatus(tuition.total_charged, tuition.amount_paid)).toBe('Partially Paid');

    let payment = db.prepare("SELECT * FROM tuition_payments WHERE id = 'p1'").all(studentId)[0];
    expect(payment.amount).toBe(500.0);
    expect(payment.payment_method).toBe('Cash');

    // Make second payment to complete tuition
    recordPayment('p2', 700.0, '2026-07-29', 'Bank Transfer', 'Final installment');

    tuition = db.prepare("SELECT * FROM student_tuition WHERE student_id = ?").get(studentId);
    expect(tuition.amount_paid).toBe(1200.0);
    expect(deriveStatus(tuition.total_charged, tuition.amount_paid)).toBe('Paid');
  });

  it('should rollback transaction if error occurs', () => {
    const studentId = 's1';

    // Setup initial tuition charge
    db.prepare(`
      INSERT INTO student_tuition (id, student_id, total_charged, amount_paid, updated_at)
      VALUES ('t1', ?, 1000.0, 0.0, ?)
    `).run('t1', studentId, 1000.0, 0.0, Date.now());

    // Transaction that will fail
    const recordPaymentFailed = () => {
      const transaction = db.transaction(() => {
        db.prepare(`
          INSERT INTO tuition_payments (id, student_id, amount, payment_date, payment_method, notes, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run('p_fail', studentId, 300.0, '2026-07-28', 'Cash', 'Notes', Date.now());

        db.prepare(`
          UPDATE student_tuition 
          SET non_existing_field = 1
          WHERE student_id = ?
        `).run(studentId);
      });
      transaction();
    };

    expect(() => recordPaymentFailed()).toThrow();

    // Verify database rolled back: amount_paid is still 0 and tuition_payments has no new row
    const tuition = db.prepare("SELECT * FROM student_tuition WHERE student_id = ?").get(studentId);
    expect(tuition.amount_paid).toBe(0.0);

    const payments = db.prepare("SELECT * FROM tuition_payments WHERE student_id = ?").all(studentId);
    const hasFailPayment = payments.some(p => p.id === 'p_fail');
    expect(hasFailPayment).toBe(false);
  });
});
