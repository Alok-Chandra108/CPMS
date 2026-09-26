const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const {
  loginLimiter,
  registerLimiter,
  sensitiveLimiter,
  apiLimiter,
  authenticatedLimiter,
  applyLimiter,
  getAuthenticatedKey,
  getPublicAuthKey,
} = require('../middleware/rateLimiter');

describe('Rate Limiter - Campus Wi-Fi & Shared IP Protection', () => {
  const TEST_SECRET = 'test_jwt_access_secret_min_32_characters_long!';
  const originalSecret = process.env.JWT_ACCESS_SECRET;

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = TEST_SECRET;
  });

  afterAll(() => {
    process.env.JWT_ACCESS_SECRET = originalSecret;
  });

  describe('getAuthenticatedKey', () => {
    it('should key by req.user.id when user object is populated', () => {
      const req = {
        user: { id: 'student_123', role: 'student' },
        ip: '103.20.10.5',
      };
      const key = getAuthenticatedKey(req);
      expect(key).toBe('user:student_123');
    });

    it('should key by req.user._id when user._id is populated', () => {
      const req = {
        user: { _id: 'student_456', role: 'student' },
        ip: '103.20.10.5',
      };
      const key = getAuthenticatedKey(req);
      expect(key).toBe('user:student_456');
    });

    it('should extract user ID from valid Bearer token if req.user is not yet populated', () => {
      const token = jwt.sign({ id: 'student_from_token_789', role: 'student' }, TEST_SECRET);
      const req = {
        headers: { authorization: `Bearer ${token}` },
        ip: '103.20.10.5',
      };
      const key = getAuthenticatedKey(req);
      expect(key).toBe('user:student_from_token_789');
    });

    it('should fall back to client IP if Bearer token is invalid', () => {
      const req = {
        headers: { authorization: 'Bearer invalid_garbage_token' },
        ip: '103.20.10.5',
      };
      const key = getAuthenticatedKey(req);
      expect(key).toBe('ip:103.20.10.5');
    });

    it('should fall back to client IP if no authorization header or user object exists', () => {
      const req = {
        headers: {},
        ip: '103.20.10.5',
      };
      const key = getAuthenticatedKey(req);
      expect(key).toBe('ip:103.20.10.5');
    });
  });

  describe('getPublicAuthKey', () => {
    const keyGen = getPublicAuthKey('login');

    it('should generate compound key with IP and normalized email', () => {
      const req = {
        ip: '103.20.10.5',
        body: { email: '  ALOK.CHANDRA@MITE.AC.IN  ' },
      };
      const key = keyGen(req);
      expect(key).toBe('login:103.20.10.5:alok.chandra@mite.ac.in');
    });

    it('should generate compound key with IP and usnNumber if provided', () => {
      const regKeyGen = getPublicAuthKey('register');
      const req = {
        ip: '103.20.10.5',
        body: { usnNumber: ' 4MT20CS001 ' },
      };
      const key = regKeyGen(req);
      expect(key).toBe('register:103.20.10.5:4mt20cs001');
    });

    it('should fall back to anonymous suffix when no identifier is provided', () => {
      const req = {
        ip: '103.20.10.5',
        body: {},
      };
      const key = keyGen(req);
      expect(key).toBe('login:103.20.10.5:anonymous');
    });

    it('should ensure two students on the same campus IP have independent buckets', () => {
      const campusIp = '103.20.10.5';
      const student1Req = { ip: campusIp, body: { email: 'student1@college.edu' } };
      const student2Req = { ip: campusIp, body: { email: 'student2@college.edu' } };

      const key1 = keyGen(student1Req);
      const key2 = keyGen(student2Req);

      expect(key1).not.toBe(key2);
      expect(key1).toBe('login:103.20.10.5:student1@college.edu');
      expect(key2).toBe('login:103.20.10.5:student2@college.edu');
    });
  });

  describe('Express Integration: Campus Wi-Fi Rate Limiting Isolation', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(express.json());

      // Create a test limiter with max 2 requests per 10 minutes for testing isolation
      const { rateLimit } = require('express-rate-limit');
      const testLoginLimiter = rateLimit({
        windowMs: 10 * 60 * 1000,
        max: 2,
        keyGenerator: getPublicAuthKey('test_login'),
        message: { success: false, message: 'Too many attempts' },
      });

      const testAuthLimiter = rateLimit({
        windowMs: 10 * 60 * 1000,
        max: 2,
        keyGenerator: getAuthenticatedKey,
        message: { success: false, message: 'Too many authenticated requests' },
      });

      app.post('/test/login', testLoginLimiter, (req, res) => {
        res.json({ success: true, user: req.body.email });
      });

      app.get('/test/protected', testAuthLimiter, (req, res) => {
        res.json({ success: true, user: req.user?.id || 'token-user' });
      });
    });

    it('should block Student A after exceeding limit without affecting Student B on the same IP', async () => {
      // Student A sends 2 requests (reaches limit)
      const res1 = await request(app)
        .post('/test/login')
        .send({ email: 'studentA@college.edu' });
      expect(res1.status).toBe(200);

      const res2 = await request(app)
        .post('/test/login')
        .send({ email: 'studentA@college.edu' });
      expect(res2.status).toBe(200);

      // Student A 3rd request -> Blocked (429)
      const res3 = await request(app)
        .post('/test/login')
        .send({ email: 'studentA@college.edu' });
      expect(res3.status).toBe(429);
      expect(res3.body.message).toBe('Too many attempts');

      // Student B on the same IP -> Allowed! Not blocked!
      const resB = await request(app)
        .post('/test/login')
        .send({ email: 'studentB@college.edu' });
      expect(resB.status).toBe(200);
      expect(resB.body.success).toBe(true);
    });

    it('should isolate authenticated students on the same IP using Bearer token', async () => {
      const tokenA = jwt.sign({ id: 'student_A' }, TEST_SECRET);
      const tokenB = jwt.sign({ id: 'student_B' }, TEST_SECRET);

      // Student A makes 2 calls (reaches limit)
      await request(app).get('/test/protected').set('Authorization', `Bearer ${tokenA}`).expect(200);
      await request(app).get('/test/protected').set('Authorization', `Bearer ${tokenA}`).expect(200);

      // Student A 3rd call -> Blocked (429)
      const resA = await request(app)
        .get('/test/protected')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(resA.status).toBe(429);

      // Student B on the exact same IP with their own token -> Allowed!
      const resB = await request(app)
        .get('/test/protected')
        .set('Authorization', `Bearer ${tokenB}`);
      expect(resB.status).toBe(200);
      expect(resB.body.success).toBe(true);
    });

    it('should throttle rapid-fire applications using applyLimiter', async () => {
      const applyApp = express();
      applyApp.use(express.json());

      // Simulate authenticated student middleware
      applyApp.use((req, res, next) => {
        req.user = { id: 'fast_clicker_student_1' };
        next();
      });

      applyApp.post('/api/v1/applications/apply/:driveId', applyLimiter, (req, res) => {
        res.status(201).json({ success: true, message: 'Application submitted' });
      });

      const driveId = 'drive_tech_corp_2026';

      // 1st click -> Success
      const first = await request(applyApp).post(`/api/v1/applications/apply/${driveId}`);
      expect(first.status).toBe(201);

      // 2nd click -> Success
      const second = await request(applyApp).post(`/api/v1/applications/apply/${driveId}`);
      expect(second.status).toBe(201);

      // 3rd click within 10s -> Blocked with 429
      const third = await request(applyApp).post(`/api/v1/applications/apply/${driveId}`);
      expect(third.status).toBe(429);
      expect(third.body.message).toContain('You are submitting applications too quickly');
    });
  });


});
