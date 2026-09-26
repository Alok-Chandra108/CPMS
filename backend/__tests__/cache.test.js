const { getCache, setCache, invalidateCache } = require('../services/cache.service');

describe('Cache Service (In-Memory)', () => {
  afterEach(async () => {
    // Invalidate everything to clean up between tests
    await invalidateCache('*');
  });

  it('should store and retrieve data from cache', async () => {
    const testData = { drives: [{ id: 1, companyName: 'Google' }] };
    const success = await setCache('drives:all', testData, 60);

    expect(success).toBe(true);

    const retrieved = await getCache('drives:all');
    expect(retrieved).toEqual(testData);
  });

  it('should return null on cache miss', async () => {
    const result = await getCache('non_existent_key');
    expect(result).toBeNull();
  });

  it('should invalidate specific key', async () => {
    await setCache('drive:123', { id: 123 }, 60);
    expect(await getCache('drive:123')).toBeTruthy();

    await invalidateCache('drive:123');
    expect(await getCache('drive:123')).toBeNull();
  });

  it('should invalidate pattern-based keys (e.g., drives:*)', async () => {
    await setCache('drives:all', [{ id: 1 }], 60);
    await setCache('drives:{"page":1}', [{ id: 1 }], 60);
    await setCache('notices:all', [{ id: 2 }], 60);

    await invalidateCache('drives:*');

    expect(await getCache('drives:all')).toBeNull();
    expect(await getCache('drives:{"page":1}')).toBeNull();
    // Notices cache remains untouched
    expect(await getCache('notices:all')).toEqual([{ id: 2 }]);
  });
});
