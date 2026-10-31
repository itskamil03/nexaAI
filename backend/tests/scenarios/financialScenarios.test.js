const request = require('supertest');
const app = require('../../src/app');
const {
  User,
  Investment,
  RoiHistory,
  ReferralIncome,
  WalletTransaction,
} = require('../../src/models');
const { processInvestmentRoi, calculateInvestmentRoi } = require('../../src/services/roiService');
const { distributeReferralIncome } = require('../../src/services/referralService');
const { normalizeDate } = require('../../src/utils/dateUtils');

describe('Mandatory Financial Integrity & Business Logic Scenarios', () => {
  let userA, userB;
  let tokenA, tokenB;

  beforeEach(async () => {
    await User.deleteMany({});
    await Investment.deleteMany({});
    await RoiHistory.deleteMany({});
    await ReferralIncome.deleteMany({});
    await WalletTransaction.deleteMany({});

    // User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Scenario User A',
        email: 'scen_a@nexachain.test',
        mobileNumber: '+1000000001',
        password: 'Password123',
      });
    userA = resA.body.data.user;
    tokenA = resA.body.data.token;

    // User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Scenario User B',
        email: 'scen_b@nexachain.test',
        mobileNumber: '+1000000002',
        password: 'Password123',
      });
    userB = resB.body.data.user;
    tokenB = resB.body.data.token;
  });

  // SCENARIO A: Repeated ROI processing for the same date must be idempotent
  test('Scenario A: Repeated ROI processing — exactly one credited transaction', async () => {
    const inv = new Investment({
      userId: userA._id || userA.id,
      amount: 1000,
      planDetails: {
        planId: 'starter',
        planName: 'Starter Yield',
        durationDays: 30,
        minAmount: 100,
        maxAmount: 1000,
      },
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-11-01'),
      dailyRoiPercentage: 1.5, // $15 per day
      status: 'Active',
    });
    await inv.save();

    const targetDate = '2026-10-15';

    // First execution
    const run1 = await processInvestmentRoi(inv._id, targetDate);
    expect(run1.status).toBe('CREDITED');
    expect(run1.roiAmount).toBe(15.0);

    // Verify balance after first run
    const userAfterRun1 = await User.findById(userA._id || userA.id);
    expect(userAfterRun1.walletBalance).toBe(15.0);
    expect(userAfterRun1.totalRoiEarned).toBe(15.0);

    // Second execution on same date
    const run2 = await processInvestmentRoi(inv._id, targetDate);
    expect(run2.status).toBe('SKIPPED');
    expect(run2.reason).toBe('ALREADY_PROCESSED');

    // Verify balance did not double
    const userAfterRun2 = await User.findById(userA._id || userA.id);
    expect(userAfterRun2.walletBalance).toBe(15.0);
    expect(userAfterRun2.totalRoiEarned).toBe(15.0);

    // Verify exactly one RoiHistory and one WalletTransaction exist
    const roiCount = await RoiHistory.countDocuments({ investmentId: inv._id, date: targetDate });
    expect(roiCount).toBe(1);

    const txCount = await WalletTransaction.countDocuments({
      userId: userA._id || userA.id,
      transactionType: 'ROI_CREDIT',
    });
    expect(txCount).toBe(1);
  });

  // SCENARIO B: Concurrent processing attempts
  test('Scenario B: Concurrent processing attempts — zero duplicate credits', async () => {
    const inv = new Investment({
      userId: userA._id || userA.id,
      amount: 2000,
      planDetails: {
        planId: 'growth',
        planName: 'Growth Vault',
        durationDays: 60,
        minAmount: 1001,
        maxAmount: 5000,
      },
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-12-01'),
      dailyRoiPercentage: 1.5,
      status: 'Active',
    });
    await inv.save();

    const targetDate = '2026-10-20';

    // Execute two parallel asynchronous calls
    const [res1, res2] = await Promise.all([
      processInvestmentRoi(inv._id, targetDate),
      processInvestmentRoi(inv._id, targetDate),
    ]);

    const statuses = [res1.status, res2.status];
    expect(statuses).toContain('CREDITED');
    expect(statuses).toContain('SKIPPED');

    // Balance should only reflect ONE credit (1.5% of 2000 = $30.00)
    const user = await User.findById(userA._id || userA.id);
    expect(user.walletBalance).toBe(30.0);
    expect(user.totalRoiEarned).toBe(30.0);

    const historyCount = await RoiHistory.countDocuments({ investmentId: inv._id, date: targetDate });
    expect(historyCount).toBe(1);
  });

  // SCENARIO C: Database transaction failure safety
  test('Scenario C: Invalid state handling — zero phantom credits', async () => {
    // Process on non-existent investment ID
    const fakeId = '507f1f77bcf86cd799439011';
    const result = await processInvestmentRoi(fakeId, '2026-10-10');
    expect(result.status).toBe('SKIPPED');
    expect(result.reason).toBe('INVESTMENT_NOT_FOUND');

    const txCount = await WalletTransaction.countDocuments({});
    expect(txCount).toBe(0);
  });

  // SCENARIO D: Cancelled investment processing
  test('Scenario D: Cancelled investment — no unauthorized ROI credit', async () => {
    const inv = new Investment({
      userId: userA._id || userA.id,
      amount: 1000,
      planDetails: { planId: 'starter', planName: 'Starter', durationDays: 30, minAmount: 100, maxAmount: 1000 },
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-11-01'),
      dailyRoiPercentage: 1.0,
      status: 'Cancelled',
    });
    await inv.save();

    const result = await processInvestmentRoi(inv._id, '2026-10-15');
    expect(result.status).toBe('SKIPPED');
    expect(result.reason).toBe('INVESTMENT_STATUS_CANCELLED');

    const user = await User.findById(userA._id || userA.id);
    expect(user.walletBalance).toBe(0);
  });

  // SCENARIO E: Matured investment enforcement
  test('Scenario E: Matured investment — transitions to Completed and stops ROI', async () => {
    const inv = new Investment({
      userId: userA._id || userA.id,
      amount: 1000,
      planDetails: { planId: 'starter', planName: 'Starter', durationDays: 30, minAmount: 100, maxAmount: 1000 },
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-09-30'),
      dailyRoiPercentage: 1.0,
      status: 'Active',
    });
    await inv.save();

    // Process on date past endDate (e.g. 2026-10-01)
    const result = await processInvestmentRoi(inv._id, '2026-10-01');
    expect(result.status).toBe('SKIPPED');
    expect(result.reason).toBe('INVESTMENT_MATURED_AND_COMPLETED');

    const updatedInv = await Investment.findById(inv._id);
    expect(updatedInv.status).toBe('Completed');

    const user = await User.findById(userA._id || userA.id);
    expect(user.walletBalance).toBe(0);
  });

  // SCENARIO F: Repeated referral distribution prevention
  test('Scenario F: Repeated referral distribution — idempotent commission', async () => {
    // Make User B referred by User A
    await User.findByIdAndUpdate(userB._id || userB.id, { referredBy: userA._id || userA.id });

    const inv = new Investment({
      userId: userB._id || userB.id,
      amount: 1000,
      planDetails: { planId: 'starter', planName: 'Starter', durationDays: 30, minAmount: 100, maxAmount: 1000 },
      startDate: new Date(),
      endDate: new Date(),
      dailyRoiPercentage: 1.0,
      status: 'Active',
    });
    await inv.save();

    // First distribution
    const dist1 = await distributeReferralIncome(userB._id || userB.id, inv._id, 1000);
    expect(dist1.length).toBe(1);
    expect(dist1[0].commissionAmount).toBe(50.0);

    // Second distribution for identical event
    const dist2 = await distributeReferralIncome(userB._id || userB.id, inv._id, 1000);
    expect(dist2.length).toBe(0); // 0 duplicate distributed

    const userAPost = await User.findById(userA._id || userA.id);
    expect(userAPost.walletBalance).toBe(50.0); // Not $100!
  });

  // SCENARIO G: Unauthorized access isolation
  test('Scenario G: Unauthorized access — User B cannot retrieve User A investment', async () => {
    // Create investment for User A
    const invA = new Investment({
      userId: userA._id || userA.id,
      amount: 500,
      planDetails: { planId: 'starter', planName: 'Starter', durationDays: 30, minAmount: 100, maxAmount: 1000 },
      startDate: new Date(),
      endDate: new Date(),
      dailyRoiPercentage: 1.0,
      status: 'Active',
    });
    await invA.save();

    // User B attempts to access User A's investment detail
    const res = await request(app)
      .get(`/api/investments/${invA._id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
