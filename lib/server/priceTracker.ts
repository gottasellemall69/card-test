import { randomUUID } from 'node:crypto';
import { getDatabase } from './database';
import { extractPriceRows, getPricesBySetId, getSetCatalogue } from './cardApi';
import { saveSetSnapshots } from './snapshots';
import { HttpError } from './errors';

type SetEntry = { name: string; setNameId: number };
type TrackingJob = {
  _id: string;
  day: string;
  status: string;
  sets: SetEntry[];
  completedIds: number[];
  rowsSaved: number;
  withoutMarketPrice: number;
  startedAt: Date;
  updatedAt: Date;
  failures: Record<string, string>;
  retryAfter?: Date;
};
type Providers = {
  sets: () => Promise<SetEntry[]>;
  prices: (set: SetEntry) => Promise<Record<string, unknown>[]>;
};

export function canManageTracking(username: string) {
  return (process.env.ADMIN_USERS || '')
    .split(',')
    .map((name) => name.trim())
    .includes(username);
}

export async function getTrackingStatus() {
  const db = await getDatabase();
  const job = await db
    .collection<TrackingJob>('priceTrackingJobs')
    .find()
    .sort({ startedAt: -1 })
    .limit(1)
    .next();
  if (!job) return { status: 'not_started', totalSets: 0, completedSets: 0, rowsSaved: 0 };
  return {
    day: job.day,
    status: job.status,
    totalSets: job.sets.length,
    completedSets: job.completedIds.length,
    remainingSets: job.sets.length - job.completedIds.length,
    rowsSaved: job.rowsSaved,
    withoutMarketPrice: job.withoutMarketPrice,
    failedSets: Object.keys(job.failures || {}).length,
    startedAt: job.startedAt,
    updatedAt: job.updatedAt,
    retryAfter: job.retryAfter || null,
  };
}

// A daily job has persistent set checkpoints. Failed sets remain pending, never "complete".
export async function runPriceTracking(
  {
    start = true,
    restart = false,
    maxDurationMs = 240000,
    maxSets = Number.POSITIVE_INFINITY,
  }: { start?: boolean; restart?: boolean; maxDurationMs?: number; maxSets?: number } = {},
  providers: Providers = {
    sets: () => getSetCatalogue({ includeInactive: true, fresh: true }),
    prices: async (set) => extractPriceRows(await getPricesBySetId(set.setNameId, { fresh: true })),
  },
) {
  const db = await getDatabase();
  const jobs = db.collection<TrackingJob>('priceTrackingJobs');
  const locks = db.collection<{ _id: string; owner: string; expiresAt: Date }>(
    'priceTrackingLocks',
  );
  const owner = randomUUID();
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const deadline = maxDurationMs === 0 ? Number.POSITIVE_INFINITY : Date.now() + maxDurationMs;
  try {
    const lock = await locks.findOneAndUpdate(
      { _id: 'catalogue', expiresAt: { $lte: now } },
      { $set: { owner, expiresAt: new Date(Date.now() + 600000) } },
      { upsert: true, returnDocument: 'after' },
    );
    if (!lock || lock.owner !== owner)
      throw new HttpError(409, 'A price tracking job is already running');
  } catch (error) {
    if ((error as { code?: number })?.code === 11000)
      throw new HttpError(409, 'A price tracking job is already running');
    throw error;
  }
  try {
    let job = await jobs.findOne({ _id: day });
    if (!job && !start) return getTrackingStatus();
    if (job?.status === 'complete' && !restart) return getTrackingStatus();
    if (!job || restart) {
      const sets = await providers.sets();
      if (!sets.length) throw new HttpError(502, 'TCGPlayer catalogue is empty');
      job = {
        _id: day,
        day,
        status: 'pending',
        sets,
        completedIds: [],
        rowsSaved: 0,
        withoutMarketPrice: 0,
        startedAt: now,
        updatedAt: now,
        failures: {},
      };
      await jobs.replaceOne({ _id: day }, job, { upsert: true });
      await jobs.updateMany(
        { day: { $lt: day }, status: { $ne: 'complete' } },
        { $set: { status: 'incomplete', updatedAt: now } },
      );
    }
    if (job.retryAfter && job.retryAfter.getTime() > Date.now()) return getTrackingStatus();
    await db
      .collection('cardPriceSnapshots')
      .createIndex({ signature: 1, day: 1 }, { unique: true });
    await db
      .collection('cardPriceSnapshots')
      .createIndex({
        setNameKey: 1,
        numberKey: 1,
        rarityKey: 1,
        editionKey: 1,
        conditionKey: 1,
        date: 1,
      });
    const completed = new Set(job.completedIds);
    let processed = 0;
    await jobs.updateOne(
      { _id: day },
      { $set: { status: 'running', updatedAt: new Date() }, $unset: { retryAfter: '' } },
    );
    for (const set of job.sets) {
      if (completed.has(set.setNameId)) continue;
      if (Date.now() + 20000 >= deadline || processed >= maxSets) break;
      await locks.updateOne(
        { _id: 'catalogue', owner },
        { $set: { expiresAt: new Date(Date.now() + 600000) } },
      );
      try {
        const rows = await providers.prices(set);
        // Timestamp the actual fetch. A resumed job never fabricates an earlier day's prices.
        const counts = await saveSetSnapshots(rows, set, new Date());
        completed.add(set.setNameId);
        await jobs.updateOne(
          { _id: day },
          {
            $addToSet: { completedIds: set.setNameId },
            $inc: { rowsSaved: counts.saved, withoutMarketPrice: counts.withoutMarketPrice },
            $set: { updatedAt: new Date() },
            $unset: { [`failures.${set.setNameId}`]: '' },
          },
        );
      } catch (error) {
        const rateLimited = error instanceof HttpError && error.statusCode === 429;
        await jobs.updateOne(
          { _id: day },
          {
            $set: {
              [`failures.${set.setNameId}`]: rateLimited
                ? 'Provider rate limit'
                : 'Price fetch failed; will retry',
              updatedAt: new Date(),
              ...(rateLimited ? { retryAfter: new Date(Date.now() + 60000) } : {}),
            },
          },
        );
        if (rateLimited) break;
      }
      processed += 1;
      if (processed < maxSets) await new Promise((resolve) => setTimeout(resolve, 250));
    }
    await jobs.updateOne(
      { _id: day },
      {
        $set: {
          status: completed.size === job.sets.length ? 'complete' : 'partial',
          updatedAt: new Date(),
        },
      },
    );
    return getTrackingStatus();
  } finally {
    await locks.deleteOne({ _id: 'catalogue', owner });
  }
}
