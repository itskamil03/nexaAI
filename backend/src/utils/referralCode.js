const crypto = require('crypto');
const User = require('../models/User');

/**
 * Generates an uppercase 8-character unique alphanumeric referral code.
 * Format: NEXA + 4 random alphanumeric characters (e.g. NEXA7K9M)
 * @returns {Promise<string>}
 */
const generateUniqueReferralCode = async () => {
  let uniqueCode = '';
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    attempts++;
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
    uniqueCode = `NX${randomHex}`; // 8 chars total: NX + 6 chars e.g. NXA1B2C3

    // Check collision against database
    const existing = await User.findOne({ referralCode: uniqueCode }).lean();
    if (!existing) {
      isUnique = true;
    }
  }

  if (!isUnique) {
    // Fallback using timestamp
    uniqueCode = `NX${Date.now().toString(36).slice(-6).toUpperCase()}`;
  }

  return uniqueCode;
};

module.exports = {
  generateUniqueReferralCode,
};
