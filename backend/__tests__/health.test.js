const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

describe('GET /health and GET /api/v1/health', () => {
  it('should return health check schema on /health', async () => {
    const res = await request(app).get('/health');

    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
    expect(['healthy', 'degraded', 'unhealthy']).toContain(res.body.status);
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptimeSeconds');
    expect(res.body).toHaveProperty('system');
    expect(res.body.system).toHaveProperty('memory');
    expect(res.body.system).toHaveProperty('instanceId');
    expect(res.body).toHaveProperty('services');
    expect(res.body.services).toHaveProperty('database');
  });

  it('should return 200 healthy on /api/v1/health when database is connected', async () => {
    const origReadyState = mongoose.connection.readyState;
    const origDb = mongoose.connection.db;

    // Simulate connected database state
    mongoose.connection.readyState = 1;
    mongoose.connection.db = {
      admin: () => ({
        ping: jest.fn().mockResolvedValue({ ok: 1 }),
      }),
    };

    try {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(['healthy', 'degraded']).toContain(res.body.status);
      expect(res.body.services.database.status).toBe('connected');
      expect(typeof res.body.services.database.latencyMs).toBe('number');
    } finally {
      // Restore original state
      mongoose.connection.readyState = origReadyState;
      mongoose.connection.db = origDb;
    }
  });

  it('should return 503 unhealthy when database is disconnected', async () => {
    const origReadyState = mongoose.connection.readyState;
    const origDb = mongoose.connection.db;

    // Simulate disconnected database state
    mongoose.connection.readyState = 0;
    mongoose.connection.db = null;

    try {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(503);
      expect(res.body.status).toBe('unhealthy');
      expect(res.body.services.database.status).toBe('disconnected');
    } finally {
      mongoose.connection.readyState = origReadyState;
      mongoose.connection.db = origDb;
    }
  });
});
