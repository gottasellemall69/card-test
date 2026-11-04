import { loadEnvConfig } from '@next/env';
import { getDatabase, closeDatabase } from '../lib/server/database';
import { ensurePriceSeriesIndexes } from '../lib/server/snapshots';
loadEnvConfig(process.cwd());
async function main() {
  try {
    const db = await getDatabase();
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('counters').createIndex({ key: 1 }, { unique: true });
    await db.collection('authRateLimits').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await db.collection('myCollection').createIndex({ userId: 1 });
    await db.collection('collectionFolders').createIndex({ userId: 1, name: 1 });
    await db.collection('sportsDataCache').createIndex({ cardSet: 1 }, { unique: true });
    await ensurePriceSeriesIndexes();
    console.log(
      'Database indexes are ready. Existing cards and legacy price history were retained.',
    );
  } catch {
    console.error(
      'Database setup failed. Check the connection and resolve any existing duplicate unique keys. No records were deleted.',
    );
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}
void main();
