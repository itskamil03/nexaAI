const request = require('supertest');
const app = require('../../src/app');
const { User } = require('../../src/models');

describe('Authentication & Security Integration Tests', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new root user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Alice Developer',
          email: 'alice@nexachain.test',
          mobileNumber: '+1234567890',
          password: 'SecurePassword123',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('alice@nexachain.test');
      expect(res.body.data.user.referralCode).toBeDefined();
      expect(res.body.data.user.referredBy).toBeNull();
      expect(res.body.data.user.walletBalance).toBe(0);
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject registration with duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Original User',
          email: 'duplicate@nexachain.test',
          mobileNumber: '+1111111111',
          password: 'Password123',
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Duplicate User',
          email: 'duplicate@nexachain.test',
          mobileNumber: '+2222222222',
          password: 'Password123',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with invalid referral code', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Referred User',
          email: 'referred@nexachain.test',
          mobileNumber: '+3333333333',
          password: 'Password123',
          referralCode: 'NONEXISTENT999',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid referral code');
    });

    it('should successfully link parent when valid referral code is provided', async () => {
      // 1. Create parent user
      const parentRes = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Parent Sponsor',
          email: 'parent@nexachain.test',
          mobileNumber: '+4444444444',
          password: 'Password123',
        });

      const parentCode = parentRes.body.data.user.referralCode;
      const parentId = parentRes.body.data.user._id || parentRes.body.data.user.id;

      // 2. Register child user with parent's referral code
      const childRes = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Child Downline',
          email: 'child@nexachain.test',
          mobileNumber: '+5555555555',
          password: 'Password123',
          referralCode: parentCode,
        });

      expect(childRes.status).toBe(201);
      expect(childRes.body.data.user.referredBy.toString()).toBe(parentId.toString());
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Login User',
          email: 'login@nexachain.test',
          mobileNumber: '+6666666666',
          password: 'CorrectPassword123',
        });
    });

    it('should log in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@nexachain.test',
          password: 'CorrectPassword123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('login@nexachain.test');
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@nexachain.test',
          password: 'WrongPassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ghost@nexachain.test',
          password: 'AnyPassword',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    let token = '';

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Profile User',
          email: 'profile@nexachain.test',
          mobileNumber: '+7777777777',
          password: 'Password123',
        });
      token = res.body.data.token;
    });

    it('should return profile for authenticated user', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('profile@nexachain.test');
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 when token is invalid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_garbage_token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
