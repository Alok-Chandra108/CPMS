const request = require('supertest');
const app = require('../app');

describe('GET /', () => {
  it('should return 200 OK and api running message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.message).toBe('CPMS API is running');
  });
});
