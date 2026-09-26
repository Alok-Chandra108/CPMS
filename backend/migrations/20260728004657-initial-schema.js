module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    // Helper to create index if it doesn't exist, or handle conflicts gracefully
    const createIndexSafe = async (collectionName, spec, options = {}) => {
      const collection = db.collection(collectionName);
      const indexes = await collection.indexes();
      const indexName = options.name || Object.keys(spec).map(k => `${k}_${spec[k]}`).join('_');
      
      const exists = indexes.some(idx => idx.name === indexName);
      if (exists) {
        console.log(`Index ${indexName} on ${collectionName} already exists, skipping`);
        return;
      }
      
      try {
        await collection.createIndex(spec, options);
        console.log(`Created index ${indexName} on ${collectionName}`);
      } catch (err) {
        if (err.codeName === 'IndexOptionsConflict') {
          console.log(`Index ${indexName} on ${collectionName} exists with different options, skipping`);
        } else {
          throw err;
        }
      }
    };

    // ── Users Collection ──────────────────────────────────────────────
    await createIndexSafe('users', { email: 1 }, { unique: true, name: 'email_1' });
    await createIndexSafe('users', { usnNumber: 1 }, { unique: true, name: 'usnNumber_1' });
    await createIndexSafe('users', { role: 1 }, { name: 'role_1' });
    await createIndexSafe('users', { department: 1 }, { name: 'department_1' });
    await createIndexSafe('users', { yearOfStudy: 1 }, { name: 'yearOfStudy_1' });
    await createIndexSafe('users', { isVerified: 1 }, { name: 'isVerified_1' });
    await createIndexSafe('users', { isActive: 1 }, { name: 'isActive_1' });
    await createIndexSafe('users', { createdAt: 1 }, { name: 'createdAt_1' });
    await createIndexSafe('users', { readNotices: 1 }, { name: 'readNotices_1' });
    
    // ── Admins Collection ─────────────────────────────────────────────
    await createIndexSafe('admins', { email: 1 }, { unique: true, name: 'email_1' });
    await createIndexSafe('admins', { readNotices: 1 }, { name: 'readNotices_1' });
    await createIndexSafe('admins', { createdAt: 1 }, { name: 'createdAt_1' });
    
    // ── StudentProfiles Collection ────────────────────────────────────
    await createIndexSafe('studentprofiles', { userId: 1 }, { unique: true, name: 'userId_1' });
    await createIndexSafe('studentprofiles', { createdAt: 1 }, { name: 'createdAt_1' });
    
    // ── Drives Collection ─────────────────────────────────────────────
    await createIndexSafe('drives', { status: 1 }, { name: 'status_1' });
    await createIndexSafe('drives', { isActive: 1 }, { name: 'isActive_1' });
    await createIndexSafe('drives', { registrationDeadline: 1 }, { name: 'registrationDeadline_1' });
    await createIndexSafe('drives', { driveDate: 1 }, { name: 'driveDate_1' });
    await createIndexSafe('drives', { createdBy: 1 }, { name: 'createdBy_1' });
    await createIndexSafe('drives', { companyName: 'text', jobRole: 'text', companyDescription: 'text' }, { name: 'text_search' });
    await createIndexSafe('drives', { 'eligibility.eligibleBranches': 1 }, { name: 'eligibility.eligibleBranches_1' });
    
    // ── Applications Collection ───────────────────────────────────────
    await createIndexSafe('applications', { studentId: 1, driveId: 1 }, { unique: true, name: 'studentId_1_driveId_1' });
    await createIndexSafe('applications', { studentId: 1 }, { name: 'studentId_1' });
    await createIndexSafe('applications', { driveId: 1 }, { name: 'driveId_1' });
    await createIndexSafe('applications', { status: 1 }, { name: 'status_1' });
    await createIndexSafe('applications', { appliedAt: 1 }, { name: 'appliedAt_1' });
    await createIndexSafe('applications', { createdAt: 1 }, { name: 'createdAt_1' });
    
    // ── Notices Collection ────────────────────────────────────────────
    await createIndexSafe('notices', { isActive: 1, isArchived: 1 }, { name: 'isActive_1_isArchived_1' });
    await createIndexSafe('notices', { category: 1 }, { name: 'category_1' });
    await createIndexSafe('notices', { postedBy: 1 }, { name: 'postedBy_1' });
    await createIndexSafe('notices', { isArchived: 1 }, { name: 'isArchived_1' });
    await createIndexSafe('notices', { archivedAt: 1 }, { name: 'archivedAt_1' });
    await createIndexSafe('notices', { createdAt: 1 }, { name: 'createdAt_1' });
    await createIndexSafe('notices', { title: 'text', body: 'text' }, { name: 'text_search' });
    
    // ── OTPs Collection ───────────────────────────────────────────────
    await createIndexSafe('otps', { email: 1 }, { unique: true, name: 'email_1' });
    await createIndexSafe('otps', { expiresAt: 1 }, { expireAfterSeconds: 0, name: 'expiresAt_1' });
    await createIndexSafe('otps', { createdAt: 1 }, { expireAfterSeconds: 600, name: 'createdAt_1' });
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    // Drop all indexes except _id
    const collections = [
      'users', 'admins', 'studentprofiles', 
      'drives', 'applications', 'notices', 'otps'
    ];
    
    for (const collName of collections) {
      const indexes = await db.collection(collName).indexes();
      for (const index of indexes) {
        if (index.name !== '_id_') {
          try {
            await db.collection(collName).dropIndex(index.name);
          } catch (err) {
            // Ignore errors for indexes that don't exist
            console.warn(`Could not drop index ${index.name} on ${collName}:`, err.message);
          }
        }
      }
    }
  }
};
