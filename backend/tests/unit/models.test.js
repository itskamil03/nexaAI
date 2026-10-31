const mongoose = require('mongoose');
const {
  User,
  Investment,
  ReferralIncome,
  RoiHistory,
  WalletTransaction,
} = require('../../src/models');

describe('Database Models Unit Tests', () => {
  beforeEach(async () => {
    // Clear collections before each test
    await User.deleteMany({});
    await Investment.deleteMany({});
    await ReferralIncome.deleteMany({});
    await RoiHistory.deleteMany({});
    await WalletTransaction.deleteMany({});
  });

  describe('User Model', () => {
    it('should hash the password before saving', async () => {
      const user = new User({
        fullName: 'Test Investor',
        email: 'investor@test.com',
        mobileNumber: '+1234567890',
        password: 'PlainPassword123',
        referralCode: 'TEST0001',
      });
      await user.save();

      expect(user.password).not.toBe('PlainPassword123');
      expect(user.password.startsWith('$2')).toBe(true);

      const isMatch = await user.comparePassword('PlainPassword123');
      expect(isMatch).toBe(true);

      const isWrongMatch = await user.comparePassword('WrongPassword');
      expect(isWrongMatch).toBe(false);
    });

    it('should enforce unique email constraint', async () => {
      const user1 = new User({
        fullName: 'User One',
        email: 'duplicate@test.com',
        mobileNumber: '+1111111111',
        password: 'Password123',
        referralCode: 'USER0001',
      });
      await user1.save();

      const user2 = new User({
        fullName: 'User Two',
        email: 'duplicate@test.com',
        mobileNumber: '+2222222222',
        password: 'Password456',
        referralCode: 'USER0002',
      });

      await expect(user2.save()).rejects.toThrow();
    });

    it('should omit password in toJSON', async () => {
      const user = new User({
        fullName: 'Secret User',
        email: 'secret@test.com',
        mobileNumber: '+3333333333',
        password: 'SecretPassword',
        referralCode: 'USER0003',
      });
      await user.save();
      const json = user.toJSON();
      expect(json.password).toBeUndefined();
      expect(json.fullName).toBe('Secret User');
    });
  });

  describe('RoiHistory Model Constraints', () => {
    it('should enforce compound uniqueness on (investmentId, date)', async () => {
      const dummyUserId = new mongoose.Types.ObjectId();
      const dummyInvId = new mongoose.Types.ObjectId();
      const dateStr = '2026-10-31';

      const roi1 = new RoiHistory({
        userId: dummyUserId,
        investmentId: dummyInvId,
        roiAmount: 15.0,
        date: dateStr,
        status: 'Credited',
      });
      await roi1.save();

      // Attempt to save second record for identical investmentId and date
      const roi2 = new RoiHistory({
        userId: dummyUserId,
        investmentId: dummyInvId,
        roiAmount: 15.0,
        date: dateStr,
        status: 'Credited',
      });

      await expect(roi2.save()).rejects.toThrow(/E11000/);
    });
  });

  describe('ReferralIncome Model Constraints', () => {
    it('should enforce compound uniqueness on (sourceEventId, level, userId)', async () => {
      const beneficiaryId = new mongoose.Types.ObjectId();
      const sourceUserId = new mongoose.Types.ObjectId();
      const eventId = new mongoose.Types.ObjectId();

      const ref1 = new ReferralIncome({
        userId: beneficiaryId,
        sourceUserId,
        sourceEventId: eventId,
        level: 1,
        incomeAmount: 50.0,
        commissionPercentage: 5.0,
        status: 'Credited',
      });
      await ref1.save();

      const ref2 = new ReferralIncome({
        userId: beneficiaryId,
        sourceUserId,
        sourceEventId: eventId,
        level: 1,
        incomeAmount: 50.0,
        commissionPercentage: 5.0,
        status: 'Credited',
      });

      await expect(ref2.save()).rejects.toThrow(/E11000/);
    });
  });

  describe('WalletTransaction Idempotency Constraint', () => {
    it('should reject duplicate idempotencyKey', async () => {
      const dummyUserId = new mongoose.Types.ObjectId();
      const tx1 = new WalletTransaction({
        userId: dummyUserId,
        transactionType: 'WALLET_DEPOSIT',
        direction: 'CREDIT',
        amount: 100.0,
        idempotencyKey: 'deposit:test:123',
        description: 'Test deposit',
      });
      await tx1.save();

      const tx2 = new WalletTransaction({
        userId: dummyUserId,
        transactionType: 'WALLET_DEPOSIT',
        direction: 'CREDIT',
        amount: 100.0,
        idempotencyKey: 'deposit:test:123',
        description: 'Duplicate test deposit',
      });

      await expect(tx2.save()).rejects.toThrow(/E11000/);
    });
  });
});
