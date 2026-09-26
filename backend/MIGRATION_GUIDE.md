# Database Migration System (migrate-mongo)

This project uses **migrate-mongo** for version-controlled database schema migrations.

## Overview

- **Tool**: `migrate-mongo` (MongoDB migration tool)
- **Config**: `backend/migrate-mongo-config.js`
- **Migrations Directory**: `backend/migrations/`
- **Changelog Collection**: `changelog` (tracks applied migrations)
- **Lock Collection**: `changelog_lock` (prevents concurrent migrations)

## Setup

The migration system is already configured to:
- Read `MONGO_URI` from `backend/.env`
- Extract database name from the connection string
- Use the project's existing connection options (pool size, timeouts)

## Commands

```bash
cd backend

# Run all pending migrations (up)
npm run migrate:up

# Rollback last migration (down)
npm run migrate:down

# Create a new migration file
npm run migrate:create migration-name

# Check migration status
npm run migrate:status
```

## Creating Migrations

### 1. Generate a new migration file
```bash
npm run migrate:create add-placement-status-to-student
```
This creates: `migrations/20260728120000-add-placement-status-to-student.js`

### 2. Edit the migration file
```javascript
module.exports = {
  async up(db, client) {
    // Forward migration - apply changes
    await db.collection('users').updateMany(
      { role: 'student' },
      { $set: { placementStatus: 'not_placed' } }
    );
    await db.collection('users').createIndex({ placementStatus: 1 });
  },

  async down(db, client) {
    // Rollback - reverse the changes
    await db.collection('users').updateMany(
      { role: 'student' },
      { $unset: { placementStatus: '' } }
    );
    await db.collection('users').dropIndex('placementStatus_1');
  }
};
```

### 3. Run the migration
```bash
npm run migrate:up
```

## Migration Structure

Each migration file exports an object with:
- **`up(db, client)`** - Applies the migration (required)
- **`down(db, client)`** - Rolls back the migration (required for reversibility)

### Parameters
- `db` - MongoDB `Db` instance (native driver, not Mongoose)
- `client` - MongoDB `MongoClient` instance

## Best Practices

### 1. Always write reversible migrations
Every `up` should have a corresponding `down`. If a change is truly irreversible (e.g., dropping a collection), document why in comments.

### 2. Use idempotent operations where possible
```javascript
// Good - safe to run multiple times
await db.collection('users').updateMany(
  { role: 'student', placementStatus: { $exists: false } },
  { $set: { placementStatus: 'not_placed' } }
);

// Avoid - fails on second run if index exists
await db.collection('users').createIndex({ placementStatus: 1 });
```

### 3. Handle indexes carefully
```javascript
async up(db) {
  // Check if index exists before creating
  const indexes = await db.collection('users').indexes();
  const hasIndex = indexes.some(idx => idx.name === 'placementStatus_1');
  if (!hasIndex) {
    await db.collection('users').createIndex({ placementStatus: 1 });
  }
}

async down(db) {
  try {
    await db.collection('users').dropIndex('placementStatus_1');
  } catch (err) {
    if (err.codeName !== 'IndexNotFound') throw err;
  }
}
```

### 4. Use the native MongoDB driver API
Migrations use the **native MongoDB Node.js driver**, not Mongoose. Common operations:

```javascript
// Collections
await db.collection('users').insertOne({ ... });
await db.collection('users').updateMany({ ... }, { ... });
await db.collection('users').deleteMany({ ... });
await db.collection('users').find({ ... }).toArray();

// Indexes
await db.collection('users').createIndex({ email: 1 }, { unique: true });
await db.collection('users').dropIndex('email_1');
await db.collection('users').indexes(); // List all indexes

// Aggregation
await db.collection('users').aggregate([ ... ]).toArray();
```

### 5. Name migrations descriptively
Use the format: `YYYYMMDDHHMMSS-description.js`
- `20260728120000-add-placement-status-to-student.js`
- `20260729093000-rename-usn-field.js`
- `20260730140000-add-index-on-drive-status.js`

### 6. Test migrations locally before deploying
```bash
# Run up
npm run migrate:up

# Verify changes in MongoDB
# Check collections, indexes, documents

# Test rollback
npm run migrate:down

# Verify rollback worked
npm run migrate:up  # Re-apply
```

## CI/CD Integration

Add to your deployment pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Run Migrations
  run: |
    cd backend
    npm run migrate:up
  env:
    MONGO_URI: ${{ secrets.MONGO_URI }}
```

## Current Migrations

| File | Description |
|------|-------------|
| `20260728004657-initial-schema.js` | Baseline - creates all indexes for existing collections |

## Troubleshooting

### Migration lock stuck
If a migration was interrupted, the lock may not release:
```javascript
// In MongoDB shell or compass
db.changelog_lock.deleteMany({})
```

### Migration already applied error
If you manually modified the database and need to re-run:
```javascript
// Remove the migration record
db.changelog.deleteOne({ "fileName": "20260728120000-xxx.js" })
```

### Check applied migrations
```bash
npm run migrate:status
```
Or directly in MongoDB:
```javascript
db.changelog.find().sort({ appliedAt: -1 })
```

## Environment Variables

Ensure `backend/.env` has:
```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/cpms?retryWrites=true&w=majority
```

The config automatically extracts the database name from the connection string.

## Resources

- [migrate-mongo GitHub](https://github.com/seppevs/migrate-mongo)
- [MongoDB Node.js Driver API](https://mongodb.github.io/node-mongodb-native/)
- [MongoDB Indexes](https://www.mongodb.com/docs/manual/indexes/)
