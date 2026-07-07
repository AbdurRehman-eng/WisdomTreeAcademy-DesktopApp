import { describe, it, expect } from 'vitest';
const { hashPassword, verifyPassword } = require('../../utils/cryptoHelper');
const { validateLicenseKey, generateLicenseKey } = require('../../utils/licenseHelper');

describe('Crypto Helper Tests', () => {
  it('should hash a password and verify it correctly', () => {
    const password = 'mySecretPassword123';
    const hash = hashPassword(password);
    
    expect(hash).toContain(':');
    expect(verifyPassword(password, hash)).toBe(true);
    expect(verifyPassword('wrongPassword', hash)).toBe(false);
  });
});

describe('License Helper Tests', () => {
  it('should validate developer key', () => {
    const key = 'WTA-DEMO-G5-ALL-EXP2028';
    const res = validateLicenseKey(key);
    expect(res.success).toBe(true);
    expect(res.info.developer).toBe(true);
  });

  it('should generate and validate cryptographic keys', () => {
    const key = generateLicenseKey('SCH001', 'G5', 'FULL');
    expect(key).toContain('WTA-SCH001-G5-FULL-');
    
    const res = validateLicenseKey(key);
    expect(res.success).toBe(true);
    expect(res.info.schoolCode).toBe('SCH001');
    expect(res.info.maxGrade).toBe('G5');
    expect(res.info.features).toBe('FULL');
  });

  it('should reject forged/invalid signatures', () => {
    const invalidKey = 'WTA-SCH001-G5-FULL-BADSIGN';
    const res = validateLicenseKey(invalidKey);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Invalid cryptographic signature');
  });

  it('should reject invalid formats', () => {
    const badFormat = 'WTA-SCH001-G5';
    const res = validateLicenseKey(badFormat);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Invalid license format');
  });
});
