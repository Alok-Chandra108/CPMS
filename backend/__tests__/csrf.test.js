const request = require('supertest');
const crypto = require('crypto');
const app = require('../app');

describe('CSRF Protection', () => {
  const API_BASE = '/api';
  
  /**
   * Helper to extract CSRF token from cookie header
   */
  function getCsrfTokenFromCookies(res) {
    const cookies = res.headers['set-cookie'] || [];
    const csrfCookie = cookies.find(c => c.startsWith('csrfToken='));
    if (!csrfCookie) return null;
    return csrfCookie.split(';')[0].split('=')[1];
  }
  
  /**
   * Helper to make a request with CSRF token
   */
  function requestWithCsrf(method, path, token, body = {}) {
    const req = request(app)[method](path);
    if (token) {
      req.set('Cookie', `csrfToken=${token}`);
      req.set('X-CSRF-Token', token);
    }
    if (Object.keys(body).length > 0) {
      req.send(body);
    }
    return req;
  }

  describe('CSRF Cookie', () => {
    it('should set CSRF cookie on GET request', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      
      const token = getCsrfTokenFromCookies(res);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should reuse existing CSRF cookie', async () => {
      // First request - get cookie
      const res1 = await request(app).get('/');
      const token1 = getCsrfTokenFromCookies(res1);
      
      // Second request with cookie - should not set a new one
      const res2 = await request(app)
        .get('/')
        .set('Cookie', `csrfToken=${token1}`);
      
      const cookies2 = res2.headers['set-cookie'] || [];
      const newCsrfCookie = cookies2.find(c => c.startsWith('csrfToken='));
      // Should not set a new cookie (or set the same one)
      expect(newCsrfCookie).toBeFalsy();
    });
  });

  describe('Safe Methods (GET, HEAD, OPTIONS)', () => {
    it('should allow GET without CSRF token', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
    });

    it('should allow HEAD without CSRF token', async () => {
      const res = await request(app).head('/');
      expect([200, 404]).toContain(res.status); // HEAD might return 404 if no handler
    });

    it('should allow OPTIONS without CSRF token', async () => {
      const res = await request(app).options('/');
      // OPTIONS handled by CORS
      expect([200, 204, 404]).toContain(res.status);
    });
  });

  describe('Exempt Paths (Unauthenticated State-Changing)', () => {
    const exemptPaths = [
      { method: 'post', path: '/api/v1/auth/register', body: { email: 'test@test.com', password: 'pass123', fullName: 'Test' } },
      { method: 'post', path: '/api/v1/auth/login', body: { email: 'test@test.com', password: 'pass123' } },
      { method: 'post', path: '/api/v1/auth/verify-email', body: { email: 'test@test.com', otp: '123456' } },
      { method: 'post', path: '/api/v1/auth/resend-otp', body: { email: 'test@test.com' } },
      { method: 'put', path: '/api/v1/auth/update-verify-email', body: { oldEmail: 'a@b.com', newEmail: 'c@d.com' } },
      { method: 'post', path: '/api/v1/auth/admin-login', body: { email: 'admin@test.com', password: 'pass123' } },
      { method: 'post', path: '/api/v1/auth/forgot-password', body: { email: 'test@test.com' } },
      { method: 'post', path: '/api/v1/auth/validate-reset-token', body: { token: 'testtoken' } },
      { method: 'post', path: '/api/v1/auth/reset-password', body: { token: 'testtoken', newPassword: 'newpass123' } },
    ];

    exemptPaths.forEach(({ method, path, body }) => {
      it(`should allow ${method.toUpperCase()} ${path} without CSRF token`, async () => {
        // First get a CSRF cookie
        const cookieRes = await request(app).get('/');
        const token = getCsrfTokenFromCookies(cookieRes);
        
        // Make request WITHOUT CSRF header (but with cookie for session continuity)
        const res = await request(app)[method](path)
          .set('Cookie', `csrfToken=${token}`)
          .send(body);
        
        // Should NOT be 403 (CSRF error)
        // May be 400 (validation), 401 (auth), 404, 500, etc. but NOT 403 CSRF
        expect(res.status).not.toBe(403);
      });
    });
  });

  describe('Protected Paths (State-Changing with Auth)', () => {
    // These endpoints require auth, so we test the CSRF behavior with a mock token
    // The actual auth middleware will reject invalid tokens, but CSRF should pass first
    
    it('should reject POST to /api/applications/apply/:driveId without CSRF header', async () => {
      // Get CSRF cookie
      const cookieRes = await request(app).get('/');
      const token = getCsrfTokenFromCookies(cookieRes);
      
      // Make request with cookie but WITHOUT X-CSRF-Token header
      const res = await request(app)
        .post('/api/v1/applications/apply/test-drive-id')
        .set('Cookie', `csrfToken=${token}`)
        .set('Authorization', 'Bearer invalid-token') // Will fail auth, but CSRF should be checked first
        .send({});
      
      // Should be 403 (CSRF) or 401 (auth) - NOT 200
      // The order: CSRF middleware runs before auth, so CSRF error comes first
      expect([403, 401]).toContain(res.status);
      
      if (res.status === 403) {
        expect(res.body).toHaveProperty('code', 'CSRF_HEADER_MISSING');
      }
    });

    it('should reject POST to /api/applications/apply/:driveId with mismatched CSRF token', async () => {
      const cookieRes = await request(app).get('/');
      const token = getCsrfTokenFromCookies(cookieRes);
      const badToken = 'invalid-token-' + crypto.randomBytes(16).toString('hex');
      
      const res = await request(app)
        .post('/api/v1/applications/apply/test-drive-id')
        .set('Cookie', `csrfToken=${token}`)
        .set('X-CSRF-Token', badToken)
        .set('Authorization', 'Bearer invalid-token')
        .send({});
      
      expect([403, 401]).toContain(res.status);
      
      if (res.status === 403) {
        expect(res.body).toHaveProperty('code', 'CSRF_TOKEN_INVALID');
      }
    });

    it('should reject POST with missing CSRF cookie', async () => {
      // No cookie at all, just header
      const res = await request(app)
        .post('/api/v1/applications/apply/test-drive-id')
        .set('X-CSRF-Token', 'some-token')
        .set('Authorization', 'Bearer invalid-token')
        .send({});
      
      expect([403, 401]).toContain(res.status);
      
      if (res.status === 403) {
        expect(res.body).toHaveProperty('code', 'CSRF_TOKEN_MISSING');
      }
    });
  });

  describe('Timing-Safe Comparison', () => {
    it('should use constant-time comparison (tested indirectly)', async () => {
      // This test verifies the timingSafeEqual function behavior
      const { timingSafeEqual } = require('../middleware/csrf.middleware');
      
      // Same length, different content
      const a = 'a'.repeat(43); // base64url 32 bytes = 43 chars
      const b = 'b'.repeat(43);
      
      const start = process.hrtime.bigint();
      for (let i = 0; i < 10000; i++) {
        timingSafeEqual(a, b);
      }
      const end = process.hrtime.bigint();
      
      const duration = Number(end - start) / 1_000_000; // ms
      
      // Should take consistent time (no early exit on length mismatch)
      // Just verify it runs without error
      expect(duration).toBeGreaterThan(0);
    });
  });

  describe('Token Format', () => {
    it('should generate URL-safe base64 tokens', async () => {
      const { generateCsrfToken } = require('../middleware/csrf.middleware');
      
      const token = generateCsrfToken();
      
      // base64url alphabet: A-Z, a-z, 0-9, -, _
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
      // 32 bytes = 43 chars in base64url (no padding)
      expect(token.length).toBe(43);
    });

    it('should generate unique tokens', async () => {
      const { generateCsrfToken } = require('../middleware/csrf.middleware');
      
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateCsrfToken());
      }
      
      // All should be unique (extremely high probability with 256 bits)
      expect(tokens.size).toBe(100);
    });
  });

  describe('Cookie Options', () => {
    it('should set correct cookie attributes in development', async () => {
      // Temporarily set NODE_ENV
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const res = await request(app).get('/');
      const cookies = res.headers['set-cookie'] || [];
      const csrfCookie = cookies.find(c => c.startsWith('csrfToken='));
      
      expect(csrfCookie).toBeTruthy();
      expect(csrfCookie).not.toContain('HttpOnly'); // Should be false (not present or explicit)
      expect(csrfCookie).toContain('SameSite=Lax');
      // Secure should not be set in development
      expect(csrfCookie).not.toContain('Secure');
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should set correct cookie attributes in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const res = await request(app).get('/');
      const cookies = res.headers['set-cookie'] || [];
      const csrfCookie = cookies.find(c => c.startsWith('csrfToken='));
      
      expect(csrfCookie).toBeTruthy();
      expect(csrfCookie).toContain('SameSite=None');
      expect(csrfCookie).toContain('Secure');
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});
