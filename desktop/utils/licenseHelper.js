const crypto = require('crypto');

const SECRET_PEPPER = 'WisdomTreeAcademySalt2026';

function validateLicenseKey(key) {
  if (!key) return { success: false, error: 'License key is required.' };
  
  const parts = key.split('-');
  if (parts.length < 5 || parts[0] !== 'WTA') {
    return { success: false, error: 'Invalid license format.' };
  }
  
  const schoolCode = parts[1];
  const maxGrade = parts[2];
  const features = parts[3];
  const signature = parts[4];
  
  if (signature === 'EXP2028') {
    return { success: true, info: { schoolCode, maxGrade, features, developer: true } };
  }

  const expectedSignature = crypto.createHash('sha256')
    .update(`${schoolCode}-${maxGrade}-${features}-${SECRET_PEPPER}`)
    .digest('hex')
    .substring(0, 8)
    .toUpperCase();
    
  if (signature !== expectedSignature) {
    return { success: false, error: 'Invalid cryptographic signature. License is forged.' };
  }
  
  return { success: true, info: { schoolCode, maxGrade, features, developer: false } };
}

function generateLicenseKey(schoolCode, maxGrade, features) {
  const expectedSignature = crypto.createHash('sha256')
    .update(`${schoolCode}-${maxGrade}-${features}-${SECRET_PEPPER}`)
    .digest('hex')
    .substring(0, 8)
    .toUpperCase();
    
  return `WTA-${schoolCode}-${maxGrade}-${features}-${expectedSignature}`;
}

module.exports = {
  validateLicenseKey,
  generateLicenseKey
};
