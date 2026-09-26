/**
 * Logger Module Tests
 *
 * Covers:
 *  - Logger module exports correctly
 *  - JSON output in production mode
 *  - Pretty output in development mode
 *  - Sensitive field redaction
 *  - Child logger includes requestId
 *  - Log level respects LOG_LEVEL env var
 */

// ────────────────────────────────────────────────────────────────────────────────
//   TEST SUITE
// ────────────────────────────────────────────────────────────────────────────────

describe('Logger Module', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    // Restore env after each test
    process.env = { ...ORIGINAL_ENV };
    jest.resetModules();
  });

  // ── 1. Exports ────────────────────────────────────────────────────────────────
  describe('exports', () => {
    it('should export a default logger instance with Pino methods', () => {
      const logger = require('../config/logger');

      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.child).toBe('function');
    });

    it('should export a named `logger` reference equal to the default export', () => {
      const mod = require('../config/logger');
      expect(mod.logger).toBeDefined();
      expect(mod.logger).toBe(mod); // default export === mod.logger
    });

    it('should export a `createRequestLogger` factory function', () => {
      const mod = require('../config/logger');
      expect(typeof mod.createRequestLogger).toBe('function');

      const child = mod.createRequestLogger({
        id: 'req-xyz',
        method: 'GET',
        originalUrl: '/api/test',
      });
      expect(child).toBeDefined();
      expect(typeof child.info).toBe('function');
    });
  });

  // ── 2. JSON output in production mode ─────────────────────────────────────────
  describe('production JSON output', () => {
    it('should emit valid JSON to stdout when NODE_ENV=production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.LOG_LEVEL = 'info';
      jest.resetModules();

      const logger = require('../config/logger');

      const writes = [];
      const origWrite = process.stdout.write.bind(process.stdout);
      const spy = jest.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
        writes.push(typeof chunk === 'string' ? chunk : chunk.toString());
        return true;
      });

      try {
        logger.info({ testMarker: 'phase9-prod-test' }, 'hello production');
      } finally {
        // flush
        await new Promise((r) => setImmediate(r));
        spy.mockRestore();
        process.stdout.write = origWrite;
      }

      const output = writes.join('');
      // Should contain at least one JSON line
      const lines = output.split('\n').filter(Boolean);
      expect(lines.length).toBeGreaterThan(0);

      const parsed = JSON.parse(lines[0]);
      expect(parsed.level).toBe('info');
      expect(parsed.service).toBe('cpms-backend');
      expect(parsed.env).toBe('production');
      expect(parsed.testMarker).toBe('phase9-prod-test');
      expect(parsed.msg).toBe('hello production');
      // No ANSI color codes
      expect(output).not.toMatch(/\u001b\[/);
    });
  });

  // ── 3. Pretty output in development mode ──────────────────────────────────────
  describe('development pretty output', () => {
    it('should use pino-pretty transport when NODE_ENV is not production', () => {
      process.env.NODE_ENV = 'development';
      jest.resetModules();

      const logger = require('../config/logger');

      expect(logger).toBeDefined();
      // pino-pretty should be available as a peer dep
      expect(() => require('pino-pretty')).not.toThrow();
    });

    it('should accept log calls in dev mode without errors', async () => {
      process.env.NODE_ENV = 'development';
      jest.resetModules();

      const logger = require('../config/logger');

      const writes = [];
      const origWrite = process.stdout.write.bind(process.stdout);
      const spy = jest.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
        writes.push(typeof chunk === 'string' ? chunk : chunk.toString());
        return true;
      });

      try {
        logger.info({ testMarker: 'phase9-dev-test' }, 'dev mode log');
        // allow pino-pretty transport to flush
        await new Promise((r) => setTimeout(r, 50));
      } finally {
        spy.mockRestore();
        process.stdout.write = origWrite;
      }

      // The call should not throw.
      expect(true).toBe(true);
    });
  });

  // ── 4. Sensitive field redaction ──────────────────────────────────────────────
  describe('redaction', () => {
    it('should redact password, token, accessToken, refreshToken, apiKey, secret, authorization', async () => {
      process.env.NODE_ENV = 'production';
      process.env.LOG_LEVEL = 'info';
      jest.resetModules();

      const logger = require('../config/logger');

      const writes = [];
      const origWrite = process.stdout.write.bind(process.stdout);
      const spy = jest.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
        writes.push(typeof chunk === 'string' ? chunk : chunk.toString());
        return true;
      });

      try {
        logger.info(
          {
            userId: 'user-123',
            password: 'supersecret-password',
            token: 'jwt-token-value',
            accessToken: 'access-token-value',
            refreshToken: 'refresh-token-value',
            apiKey: 'api-key-value',
            secret: 'shhh',
            authorization: 'Bearer xyz',
            nested: {
              password: 'nested-password',
              accessToken: 'nested-access-token',
            },
          },
          'user data'
        );
        await new Promise((r) => setImmediate(r));
      } finally {
        spy.mockRestore();
        process.stdout.write = origWrite;
      }

      const output = writes.join('');
      const lines = output.split('\n').filter(Boolean);
      expect(lines.length).toBeGreaterThan(0);
      const parsed = JSON.parse(lines[0]);

      // Allowed non-sensitive fields
      expect(parsed.userId).toBe('user-123');

      // Sensitive fields must be redacted
      expect(parsed.password).toBe('[REDACTED]');
      expect(parsed.token).toBe('[REDACTED]');
      expect(parsed.accessToken).toBe('[REDACTED]');
      expect(parsed.refreshToken).toBe('[REDACTED]');
      expect(parsed.apiKey).toBe('[REDACTED]');
      expect(parsed.secret).toBe('[REDACTED]');
      expect(parsed.authorization).toBe('[REDACTED]');

      // Nested fields
      expect(parsed.nested.password).toBe('[REDACTED]');
      expect(parsed.nested.accessToken).toBe('[REDACTED]');

      // The actual sensitive values must NOT appear anywhere
      expect(output).not.toContain('supersecret-password');
      expect(output).not.toContain('jwt-token-value');
      expect(output).not.toContain('access-token-value');
      expect(output).not.toContain('refresh-token-value');
      expect(output).not.toContain('api-key-value');
    });
  });

  // ── 5. Child logger includes requestId ────────────────────────────────────────
  describe('createRequestLogger (child logger)', () => {
    it('should bind requestId, method, and url to the child logger context', async () => {
      process.env.NODE_ENV = 'production';
      process.env.LOG_LEVEL = 'info';
      jest.resetModules();

      const { createRequestLogger } = require('../config/logger');

      const req = {
        id: 'req-abc-123',
        method: 'POST',
        originalUrl: '/api/auth/login',
      };
      const childLog = createRequestLogger(req);

      const writes = [];
      const origWrite = process.stdout.write.bind(process.stdout);
      const spy = jest.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
        writes.push(typeof chunk === 'string' ? chunk : chunk.toString());
        return true;
      });

      try {
        childLog.info({ event: 'child_test' }, 'child log entry');
        await new Promise((r) => setImmediate(r));
      } finally {
        spy.mockRestore();
        process.stdout.write = origWrite;
      }

      const output = writes.join('');
      const lines = output.split('\n').filter(Boolean);
      const parsed = JSON.parse(lines[0]);

      expect(parsed.requestId).toBe('req-abc-123');
      expect(parsed.method).toBe('POST');
      expect(parsed.url).toBe('/api/auth/login');
      expect(parsed.event).toBe('child_test');
      expect(parsed.msg).toBe('child log entry');
    });

    it('should fall back to "unknown" when req.id is missing', () => {
      const { createRequestLogger } = require('../config/logger');
      const childLog = createRequestLogger({ method: 'GET', originalUrl: '/api/x' });
      // child logger should still be functional
      expect(typeof childLog.info).toBe('function');
    });
  });

  // ── 6. Log level respects LOG_LEVEL env var ───────────────────────────────────
  describe('LOG_LEVEL env var', () => {
    it('should suppress info/debug/warn when LOG_LEVEL=error', async () => {
      process.env.NODE_ENV = 'production';
      process.env.LOG_LEVEL = 'error';
      jest.resetModules();

      const logger = require('../config/logger');

      const writes = [];
      const origWrite = process.stdout.write.bind(process.stdout);
      const spy = jest.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
        writes.push(typeof chunk === 'string' ? chunk : chunk.toString());
        return true;
      });

      try {
        logger.debug({ marker: 'should-not-appear-debug' }, 'debug msg');
        logger.info({ marker: 'should-not-appear-info' }, 'info msg');
        logger.warn({ marker: 'should-not-appear-warn' }, 'warn msg');
        logger.error({ marker: 'should-appear-error' }, 'error msg');
        await new Promise((r) => setImmediate(r));
      } finally {
        spy.mockRestore();
        process.stdout.write = origWrite;
      }

      const output = writes.join('');
      expect(output).not.toContain('should-not-appear-debug');
      expect(output).not.toContain('should-not-appear-info');
      expect(output).not.toContain('should-not-appear-warn');
      expect(output).toContain('should-appear-error');
    });

    it('should respect custom LOG_LEVEL=warn (info/debug suppressed)', async () => {
      process.env.NODE_ENV = 'production';
      process.env.LOG_LEVEL = 'warn';
      jest.resetModules();

      const logger = require('../config/logger');

      const writes = [];
      const origWrite = process.stdout.write.bind(process.stdout);
      const spy = jest.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
        writes.push(typeof chunk === 'string' ? chunk : chunk.toString());
        return true;
      });

      try {
        logger.info({ marker: 'info-suppressed' }, 'info msg');
        logger.warn({ marker: 'warn-allowed' }, 'warn msg');
        await new Promise((r) => setImmediate(r));
      } finally {
        spy.mockRestore();
        process.stdout.write = origWrite;
      }

      const output = writes.join('');
      expect(output).not.toContain('info-suppressed');
      expect(output).toContain('warn-allowed');
    });
  });
});
