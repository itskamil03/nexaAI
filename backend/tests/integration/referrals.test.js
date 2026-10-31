const request = require('supertest');
const app = require('../../src/app');
const { User, Investment, ReferralIncome, WalletTransaction } = require('../../src/models');

describe('Referral Hierarchy & Commission Integration Tests', () => {
  let userA, userB, userC;
  let tokenA, tokenB, tokenC;

  beforeEach(async () => {
    await User.deleteMany({});
    await Investment.deleteMany({});
    await ReferralIncome.deleteMany({});
    await WalletTransaction.deleteMany({});

    // 1. Create User A (Grandparent / Root)
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'User A (Root)',
        email: 'usera@nexachain.test',
        mobileNumber: '+1111111111',
        password: 'Password123',
      });
    userA = resA.body.data.user;
    tokenA = resA.body.data.token;

    // 2. Create User B with User A's referralCode (Level 1 to A)
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'User B (Level 1)',
        email: 'userb@nexachain.test',
        mobileNumber: '+2222222222',
        password: 'Password123',
        referralCode: userA.referralCode,
      });
    userB = resB.body.data.user;
    tokenB = resB.body.data.token;

    // 3. Create User C with User B's referralCode (Level 1 to B, Level 2 to A)
    const resC = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'User C (Level 2 to A, Level 1 to B)',
        email: 'userc@nexachain.test',
        mobileNumber: '+3333333333',
        password: 'Password123',
        referralCode: userB.referralCode,
      });
    userC = resC.body.data.user;
    tokenC = resC.body.data.token;
  });

  it('should distribute correct tiered commissions when downline invests', async () => {
    // Fund User C wallet with $1000
    await request(app)
      .post('/api/wallet/deposit')
      .set('Authorization', `Bearer ${tokenC}`)
      .send({ amount: 1000 });

    // User C creates $1000 investment in starter plan
    const invRes = await request(app)
      .post('/api/investments')
      .set('Authorization', `Bearer ${tokenC}`)
      .send({
        planId: 'starter',
        amount: 1000,
      });

    expect(invRes.status).toBe(201);

    // Verify User B received Level 1 commission: 5% of $1000 = $50
    const updatedUserB = await User.findById(userB._id || userB.id);
    expect(updatedUserB.walletBalance).toBe(50.0);
    expect(updatedUserB.totalLevelIncomeEarned).toBe(50.0);

    // Verify User A received Level 2 commission: 3% of $1000 = $30
    const updatedUserA = await User.findById(userA._id || userA.id);
    expect(updatedUserA.walletBalance).toBe(30.0);
    expect(updatedUserA.totalLevelIncomeEarned).toBe(30.0);

    // Verify ReferralIncome records
    const refIncomes = await ReferralIncome.find({});
    expect(refIncomes.length).toBe(2);

    const bRecord = refIncomes.find(r => r.userId.toString() === (userB._id || userB.id).toString());
    expect(bRecord.level).toBe(1);
    expect(bRecord.incomeAmount).toBe(50.0);

    const aRecord = refIncomes.find(r => r.userId.toString() === (userA._id || userA.id).toString());
    expect(aRecord.level).toBe(2);
    expect(aRecord.incomeAmount).toBe(30.0);
  });

  it('should return direct referrals correctly for User A', async () => {
    const res = await request(app)
      .get('/api/referrals/direct')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(1);
    expect(res.body.data.directReferrals[0].email).toBe('userb@nexachain.test');
  });

  it('should return nested hierarchical referral tree for User A', async () => {
    const res = await request(app)
      .get('/api/referrals/tree')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    const tree = res.body.data.tree;
    expect(tree).toBeDefined();
    expect(tree.email).toBe('usera@nexachain.test');
    expect(tree.children.length).toBe(1);
    expect(tree.children[0].email).toBe('userb@nexachain.test');
    expect(tree.children[0].children.length).toBe(1);
    expect(tree.children[0].children[0].email).toBe('userc@nexachain.test');
  });
});
