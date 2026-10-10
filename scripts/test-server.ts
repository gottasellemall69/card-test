// E2E tests always use a disposable database, even when .env.local points at a real database.
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { CARD_SETS } from '../constants/cardSets';
import { snapshotFromRow } from '../lib/server/snapshots';

async function main() {
  const mongo = await MongoMemoryServer.create({
    instance: {
      args: [
        ...(process.platform === 'win32' ? [] : ['--nounixsocket']),
        '--setParameter',
        'diagnosticDataCollectionEnabled=false',
      ],
    },
  });
  const client = await MongoClient.connect(mongo.getUri());
  const db = client.db('cardPriceApp_e2e');
  const set = { name: '2003 Collectors Tin', setNameId: 42 };
  const row = {
    productName: 'Fixture Dragon',
    productID: 123,
    set: set.name,
    number: 'TEST-001',
    printing: 'Limited Edition',
    rarity: 'Secret Rare',
    condition: 'Near Mint Limited Edition',
    marketPrice: 12,
  };
  await db
    .collection('cardPriceSnapshots')
    .insertMany([
      snapshotFromRow(row, set, new Date('2026-01-01T01:00:00Z')),
      snapshotFromRow({ ...row, marketPrice: 13 }, set, new Date('2026-01-02T01:00:00Z')),
    ]);
  await db.collection('sportsDataCache').insertOne({
    cardSet: CARD_SETS[0],
    data: [
      {
        products: [
          {
            id: 'sports-test-1',
            productName: 'Test Player #10',
            price1: '$10.00',
            price2: '$30.00',
            price3: '$20.00',
            consoleUri: '/game/baseball-cards-1952-topps/test-player-10',
          },
        ],
      },
    ],
    fetchedAt: new Date(),
  });
  await client.close();
  const server = spawn(
    process.execPath,
    ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '-p', '3100'],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        MONGODB_URI: mongo.getUri(),
        MONGODB_DATABASE: 'cardPriceApp_e2e',
        JWT_SECRET: randomBytes(48).toString('hex'),
        ADMIN_USERS: 'test-admin',
        CRON_SECRET: randomBytes(32).toString('hex'),
        APP_URL: 'http://127.0.0.1:3100',
        NEXT_PUBLIC_API_URL: '/api',
      },
    },
  );
  let stopping = false;
  async function stop() {
    if (stopping) return;
    stopping = true;
    server.kill('SIGTERM');
    await mongo.stop();
  }
  process.on('SIGTERM', () => {
    void stop();
  });
  process.on('SIGINT', () => {
    void stop();
  });
  server.on('exit', (code) => {
    void stop().then(() => {
      process.exitCode = code || 0;
    });
  });
}
void main().catch(() => {
  console.error('Could not start the isolated test server');
  process.exitCode = 1;
});
