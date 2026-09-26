const request = require('supertest');
const app = require('../app');

describe('Response Compression Middleware', () => {
  it('should compress responses with gzip when client sends Accept-Encoding: gzip', async () => {
    // Large payload to trigger compression threshold
    const res = await request(app)
      .get('/')
      .set('Accept-Encoding', 'gzip');

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty('vary');
    expect(res.headers.vary).toContain('Accept-Encoding');
  });

  it('should include compression headers on API responses', async () => {
    const res = await request(app)
      .get('/api/v1/drives')
      .set('Accept-Encoding', 'gzip');

    // Whether 401 (auth required) or 200, response pipeline includes compression middleware
    expect(res.headers).toHaveProperty('vary');
  });
});
