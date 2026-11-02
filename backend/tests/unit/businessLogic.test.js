const { calculateInvestmentRoi } = require('../../src/services/roiService');
const { roundTo2Decimals, toCents, fromCents } = require('../../src/utils/mathPrecision');
const { normalizeDate, addDays } = require('../../src/utils/dateUtils');
const { getCommissionRateForLevel, REFERRAL_CONFIG } = require('../../src/config/referral');
const { getPlanById, INVESTMENT_PLANS } = require('../../src/config/plans');
const { generateToken, verifyToken } = require('../../src/utils/jwt');
const bcrypt = require('bcryptjs');

describe('Core Business Logic & Monetary Precision Unit Tests', () => {
  describe('Monetary Precision & Float Drift (mathPrecision)', () => {
    it('should correctly round floating point numbers to 2 decimal places with epsilon compensation', () => {
      // Classic 0.1 + 0.2 float drift in JavaScript is 0.30000000000000004
      expect(roundTo2Decimals(0.1 + 0.2)).toBe(0.3);
      expect(roundTo2Decimals(19.999)).toBe(20.0);
      expect(roundTo2Decimals(19.994)).toBe(19.99);
      expect(roundTo2Decimals(1234.5678)).toBe(1234.57);
    });

    it('should return 0 for non-finite, NaN, null, and non-number values', () => {
      expect(roundTo2Decimals(NaN)).toBe(0);
      expect(roundTo2Decimals(Infinity)).toBe(0);
      expect(roundTo2Decimals(-Infinity)).toBe(0);
      expect(roundTo2Decimals(null)).toBe(0);
      expect(roundTo2Decimals(undefined)).toBe(0);
      expect(roundTo2Decimals('100.50')).toBe(0);
    });

    it('should accurately convert to cents and back to dollars without drift', () => {
      expect(toCents(19.99)).toBe(1999);
      expect(toCents(0.01)).toBe(1);
      expect(toCents(100.0)).toBe(10000);

      expect(fromCents(1999)).toBe(19.99);
      expect(fromCents(1)).toBe(0.01);
      expect(fromCents(10000)).toBe(100.0);
    });
  });

  describe('ROI Calculation Logic (calculateInvestmentRoi)', () => {
    it('should calculate exact daily ROI for valid investment amounts and percentages', () => {
      // Plan: $1,000 at 1.0% daily ROI = $10.00
      expect(calculateInvestmentRoi({ amount: 1000, dailyRoiPercentage: 1.0 })).toBe(10.0);

      // Plan: $2,500 at 1.5% daily ROI = $37.50
      expect(calculateInvestmentRoi({ amount: 2500, dailyRoiPercentage: 1.5 })).toBe(37.5);

      // Plan: $10,000 at 2.0% daily ROI = $200.00
      expect(calculateInvestmentRoi({ amount: 10000, dailyRoiPercentage: 2.0 })).toBe(200.0);
    });

    it('should return 0 if investment is missing or invalid', () => {
      expect(calculateInvestmentRoi(null)).toBe(0);
      expect(calculateInvestmentRoi({})).toBe(0);
      expect(calculateInvestmentRoi({ amount: 0, dailyRoiPercentage: 1.5 })).toBe(0);
      expect(calculateInvestmentRoi({ amount: 1000, dailyRoiPercentage: 0 })).toBe(0);
    });
  });

  describe('Referral Commission Tier Logic (referral)', () => {
    it('should return approved commission rates for supported levels', () => {
      expect(getCommissionRateForLevel(1)).toBe(5.0); // Level 1 = 5%
      expect(getCommissionRateForLevel(2)).toBe(3.0); // Level 2 = 3%
      expect(getCommissionRateForLevel(3)).toBe(2.0); // Level 3 = 2%
    });

    it('should return 0 for levels exceeding max depth', () => {
      expect(getCommissionRateForLevel(4)).toBe(0);
      expect(getCommissionRateForLevel(0)).toBe(0);
      expect(getCommissionRateForLevel(-1)).toBe(0);
      expect(getCommissionRateForLevel(99)).toBe(0);
    });

    it('should verify maxDepth is configured to 3 levels', () => {
      expect(REFERRAL_CONFIG.maxDepth).toBe(3);
      expect(REFERRAL_CONFIG.tiers.length).toBe(3);
    });
  });

  describe('Investment Plan Configuration (plans)', () => {
    it('should provide starter, growth, and enterprise plans', () => {
      expect(INVESTMENT_PLANS.length).toBeGreaterThanOrEqual(3);

      const starter = getPlanById('starter');
      expect(starter).toBeDefined();
      expect(starter.minAmount).toBe(100);
      expect(starter.maxAmount).toBe(1000);
      expect(starter.dailyRoiPercentage).toBe(1.0);
      expect(starter.durationDays).toBe(30);

      const growth = getPlanById('growth');
      expect(growth).toBeDefined();
      expect(growth.minAmount).toBe(1001);
      expect(growth.maxAmount).toBe(5000);
      expect(growth.dailyRoiPercentage).toBe(1.5);
      expect(growth.durationDays).toBe(60);

      const enterprise = getPlanById('enterprise');
      expect(enterprise).toBeDefined();
      expect(enterprise.minAmount).toBe(5001);
      expect(enterprise.maxAmount).toBe(50000);
      expect(enterprise.dailyRoiPercentage).toBe(2.0);
      expect(enterprise.durationDays).toBe(90);
    });

    it('should return null for non-existent plans', () => {
      expect(getPlanById('non_existent_plan_xyz')).toBeNull();
    });
  });

  describe('Date Utilities & Timezone Normalization (dateUtils)', () => {
    it('should normalize Date objects to YYYY-MM-DD string format', () => {
      const d = new Date('2026-10-31T15:30:00.000Z');
      const normalized = normalizeDate(d, 'UTC');
      expect(normalized).toBe('2026-10-31');
    });

    it('should pass through already-normalized YYYY-MM-DD strings directly', () => {
      expect(normalizeDate('2026-12-25')).toBe('2026-12-25');
      expect(normalizeDate('  2026-01-01  ')).toBe('2026-01-01');
    });

    it('should accurately calculate future dates with addDays', () => {
      const start = new Date('2026-10-01T00:00:00.000Z');
      const end30 = addDays(start, 30);
      expect(normalizeDate(end30, 'UTC')).toBe('2026-10-31');
    });

    it('should throw error for unparseable dates', () => {
      expect(() => normalizeDate('not-a-date')).toThrow(/Invalid date/);
    });
  });

  describe('Cryptographic Authentication & JWT (jwt, bcrypt)', () => {
    it('should securely hash passwords and verify matching passwords with bcrypt', async () => {
      const password = 'SuperSecureUserPassword2026!';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2')).toBe(true);

      const isMatch = await bcrypt.compare(password, hash);
      expect(isMatch).toBe(true);

      const isWrongMatch = await bcrypt.compare('WrongPassword123', hash);
      expect(isWrongMatch).toBe(false);
    });

    it('should sign and verify JWT tokens containing user payload', () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'jwt_test@nexachain.test',
        referralCode: 'NXTEST01',
      };

      const token = generateToken(mockUser);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);

      const decoded = verifyToken(token);
      expect(decoded.id).toBe(mockUser._id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.referralCode).toBe(mockUser.referralCode);
    });

    it('should throw on forged or tampered JWT token', () => {
      const forgedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.tampered_signature';
      expect(() => verifyToken(forgedToken)).toThrow();
    });
  });
});
