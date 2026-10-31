const request = require('supertest');
const app = require('../../src/app');
const { User, Investment, WalletTransaction } = require('../../src/models');

describe('Investment & Dashboard Integration Tests', () => {
  let token = '';
  let userId = '';

  beforeEach(async () => {
    await User.deleteMany({});
    await Investment.deleteMany({});
    await WalletTransaction.deleteMany({});

    // Register test user
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Investor One',
        email: 'investor1@nexachain.test',
        mobileNumber: '+1000000000',
        password: 'Password123',
      });

    token = res.body.data.token;
    userId = res.body.data.user._id || res.body.data.user.id;
  });

  describe('GET /api/investments/plans', () => {
    it('should return available configured plans', async () => {
      const res = await request(app).get('/api/investments/plans');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.plans)).toBe(true);
      expect(res.body.data.plans.length).toBeGreaterThan(0);
      expect(res.body.data.plans[0]).toHaveProperty('planId');
      expect(res.body.data.plans[0]).toHaveProperty('dailyRoiPercentage');
    });
  });

  describe('POST /api/investments', () => {
    it('should reject investment if wallet balance is insufficient', async () => {
      const res = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          planId: 'starter',
          amount: 500,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Insufficient wallet balance');
    });

    it('should reject investment if amount is outside plan limits', async () => {
      // Deposit funds first
      await request(app)
        .post('/api/wallet/deposit')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 10000 });

      // 'starter' plan minAmount is 100, maxAmount is 1000. Try 50.
      const res = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          planId: 'starter',
          amount: 50,
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('outside allowed range');
    });

    it('should successfully create investment and debit wallet balance', async () => {
      // 1. Fund wallet with $2000
      await request(app)
        .post('/api/wallet/deposit')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 2000 });

      // 2. Create $500 investment in starter plan
      const res = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          planId: 'starter',
          amount: 500,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.investment.amount).toBe(500);
      expect(res.body.data.investment.status).toBe('Active');
      expect(res.body.data.investment.dailyRoiPercentage).toBe(1.0);
      expect(res.body.data.walletBalance).toBe(1500); // 2000 - 500 = 1500

      // Verify audit transaction was recorded
      const tx = await WalletTransaction.findOne({
        userId,
        transactionType: 'INVESTMENT_DEBIT',
      });
      expect(tx).not.toBeNull();
      expect(tx.amount).toBe(500);
      expect(tx.direction).toBe('DEBIT');
    });
  });

  describe('GET /api/dashboard/summary', () => {
    it('should return authoritative financial metrics', async () => {
      // Fund and invest
      await request(app)
        .post('/api/wallet/deposit')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 1000 });

      await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${token}`)
        .send({ planId: 'starter', amount: 400 });

      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics).toBeDefined();
      expect(res.body.data.metrics.totalInvestments).toBe(400);
      expect(res.body.data.metrics.walletBalance).toBe(600); // 1000 - 400 = 600
      expect(res.body.data.metrics.dailyExpectedRoi).toBe(4.0); // 1% of 400 = 4.0
      expect(Array.isArray(res.body.data.earningsChartData)).toBe(true);
    });
  });
});
