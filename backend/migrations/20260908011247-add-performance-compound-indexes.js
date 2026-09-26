module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    // Idempotent helper to create index if it doesn't already exist
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
        await collection.createIndex(spec, { ...options, name: indexName });
        console.log(`Created index ${indexName} on ${collectionName}`);
      } catch (err) {
        if (err.codeName === 'IndexOptionsConflict') {
          console.log(`Index ${indexName} on ${collectionName} exists with different options, skipping`);
        } else {
          throw err;
        }
      }
    };

    // ── Drives Collection Compound Indexes ───────────────────────────
    await createIndexSafe('drives', { isActive: 1, status: 1, createdAt: -1 }, { name: 'isActive_1_status_1_createdAt_-1' });
    await createIndexSafe('drives', { status: 1, registrationDeadline: 1 }, { name: 'status_1_registrationDeadline_1' });
    await createIndexSafe('drives', { createdBy: 1, createdAt: -1 }, { name: 'createdBy_1_createdAt_-1' });

    // ── Notices Collection Compound Indexes ──────────────────────────
    await createIndexSafe('notices', { isActive: 1, isArchived: 1, createdAt: -1 }, { name: 'isActive_1_isArchived_1_createdAt_-1' });
    await createIndexSafe('notices', { isActive: 1, isArchived: 1, category: 1, createdAt: -1 }, { name: 'isActive_1_isArchived_1_category_1_createdAt_-1' });
    await createIndexSafe('notices', { isArchived: 1, archivedAt: -1 }, { name: 'isArchived_1_archivedAt_-1' });
    await createIndexSafe('notices', { postedBy: 1, createdAt: -1 }, { name: 'postedBy_1_createdAt_-1' });

    // ── Applications Collection Compound Indexes ─────────────────────
    await createIndexSafe('applications', { driveId: 1, appliedAt: -1 }, { name: 'driveId_1_appliedAt_-1' });
    await createIndexSafe('applications', { driveId: 1, status: 1 }, { name: 'driveId_1_status_1' });
    await createIndexSafe('applications', { studentId: 1, appliedAt: -1 }, { name: 'studentId_1_appliedAt_-1' });

    // ── Users Collection Compound Indexes ────────────────────────────
    await createIndexSafe('users', { role: 1, department: 1, createdAt: -1 }, { name: 'role_1_department_1_createdAt_-1' });
    await createIndexSafe('users', { role: 1, createdAt: -1 }, { name: 'role_1_createdAt_-1' });
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    const dropIndexSafe = async (collectionName, indexName) => {
      try {
        await db.collection(collectionName).dropIndex(indexName);
        console.log(`Dropped index ${indexName} on ${collectionName}`);
      } catch (err) {
        console.log(`Could not drop index ${indexName} on ${collectionName}: ${err.message}`);
      }
    };

    // Rollback Drives indexes
    await dropIndexSafe('drives', 'isActive_1_status_1_createdAt_-1');
    await dropIndexSafe('drives', 'status_1_registrationDeadline_1');
    await dropIndexSafe('drives', 'createdBy_1_createdAt_-1');

    // Rollback Notices indexes
    await dropIndexSafe('notices', 'isActive_1_isArchived_1_createdAt_-1');
    await dropIndexSafe('notices', 'isActive_1_isArchived_1_category_1_createdAt_-1');
    await dropIndexSafe('notices', 'isArchived_1_archivedAt_-1');
    await dropIndexSafe('notices', 'postedBy_1_createdAt_-1');

    // Rollback Applications indexes
    await dropIndexSafe('applications', 'driveId_1_appliedAt_-1');
    await dropIndexSafe('applications', 'driveId_1_status_1');
    await dropIndexSafe('applications', 'studentId_1_appliedAt_-1');

    // Rollback Users indexes
    await dropIndexSafe('users', 'role_1_department_1_createdAt_-1');
    await dropIndexSafe('users', 'role_1_createdAt_-1');
  }
};
