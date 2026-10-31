const request = require('supertest');
const app = require('../../src/app');
const { User, Investment, RoiHistory, JobLock, WalletTransaction } = require('../../src/models');
const { executeScheduledRoiBatch } = require('../../src/jobs/roiScheduler');

describe('Scheduler & Admin Manual ROI Processing Tests', () => {
  let user;
  let investment;
  const testDate = '2026-10-31';

  beforeEach(async () => {
    await User.deleteMany({});
    await Investment.deleteMany({});
    await RoiHistory.deleteMany({});
    await JobLock.deleteMany({});
    await WalletTransaction.deleteMany({});

    user = new User({
      fullName: 'Scheduler Test User',
      email: 'sched@nexachain.test',
      mobileNumber: '+9999999999',
      password: 'Password123',
      referralCode: 'SCHED001',
      walletBalance: 0,
      totalRoiEarned: 0,
      accountStatus: 'Active',
    });
    await user.save();

    investment = new Investment({
      userId: user._id,
      amount: 1000,
      planDetails: {
        planId: 'starter',
        planName: 'Starter Yield',
        durationDays: 30,
        minAmount: 100,
        maxAmount: 1000,
      },
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-11-30'),
      dailyRoiPercentage: 1.0, // $10/day
      status: 'Active',
    });
    await investment.save();
  });

  it('should execute scheduled batch with JobLock coordination and update balances', async () => {
    const summary = await executeScheduledRoiBatch(testDate);

    expect(summary.processedCount).toBe(1);
    expect(summary.totalRoiAmount).toBe(10.0);

    // Verify User received credit
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.walletBalance).toBe(10.0);
    expect(updatedUser.totalRoiEarned).toBe(10.0);

    // Verify JobLock was created and marked COMPLETED
    const lock = await JobLock.findById(`daily_roi_${testDate}`);
    expect(lock).not.toBeNull();
    expect(lock.status).toBe('COMPLETED');
  });

  it('should skip duplicate scheduler run for the same date', async () => {
    // 1st run
    await executeScheduledRoiBatch(testDate);

    // 2nd run
    const result2 = await executeScheduledRoiBatch(testDate);
    expect(result2.skipped).toBe(true);
    expect(result2.reason).toBe('LOCK_ALREADY_ACQUIRED');

    // Balance must still be $10
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.walletBalance).toBe(10.0);
  });

  it('should support manual trigger via POST /api/admin/roi/process', async () => {
    const res = await request(app)
      .post('/api/admin/roi/process')
      .send({ processingDate: '2026-10-25' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.processedCount).toBe(1);
    expect(res.body.data.totalRoiAmount).toBe(10.0);

    const updatedUser = await User.findById(user._id);
    expect(updatedUser.walletBalance).toBe(10.0);
  });
});
