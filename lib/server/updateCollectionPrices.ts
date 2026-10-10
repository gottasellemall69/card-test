import { createHash, randomUUID } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { getDatabase } from './database';
import { getCardData, getSetNameIdMap, extractPriceRows } from './cardApi';
import { verifySession } from './session';
import { HttpError } from './errors';
import { findBestPriceRow } from '@/lib/cards/match';
import { parsePrice } from '@/lib/cards/prices';
import { recordPriceHistoryEntry } from '@/utils/priceHistoryStore';

type Job = {
  _id: ObjectId;
  userId: string;
  plan: string;
  status: string;
  completedSetKeys: string[];
  updatedAt: Date;
};
export default async function updateCollectionPrices(context: string | { token?: string | null }) {
  const token = typeof context === 'string' ? context.replace(/^Bearer /i, '') : context.token;
  const user = verifySession(token);
  if (!user) throw new HttpError(401, 'Unauthorized');
  const db = await getDatabase();
  const collection = db.collection('myCollection');
  const cards = await collection.find({ userId: user.username }).toArray();
  const sets = [
    ...new Set(cards.map((card) => String(card.setName || '').trim()).filter(Boolean)),
  ].sort();
  const plan = createHash('sha256')
    .update(
      JSON.stringify(
        cards
          .map((card) => [
            card._id.toString(),
            card.setName,
            card.number,
            card.rarity,
            card.printing,
            card.condition,
          ])
          .sort(),
      ),
    )
    .digest('hex');
  const jobs = db.collection<Job>('yugiohPriceUpdateJobs');
  const locks = db.collection<{ _id: string; owner: string; expiresAt: Date }>(
    'collectionPriceLocks',
  );
  const owner = randomUUID();
  try {
    await locks.findOneAndUpdate(
      { _id: user.username, expiresAt: { $lte: new Date() } },
      { $set: { owner, expiresAt: new Date(Date.now() + 600000) } },
      { upsert: true },
    );
  } catch (error) {
    if ((error as { code?: number })?.code === 11000)
      throw new HttpError(409, 'A collection price update is already running');
    throw error;
  }
  try {
    let job = await jobs.findOne({ userId: user.username, plan, status: { $ne: 'complete' } });
    if (!job) {
      job = {
        _id: new ObjectId(),
        userId: user.username,
        plan,
        status: 'running',
        completedSetKeys: [],
        updatedAt: new Date(),
      };
      await jobs.insertOne(job);
    }
    const completed = new Set(job.completedSetKeys);
    const deadline = Date.now() + 240000;
    const updated: Record<string, unknown>[] = [];
    const unmatched: Record<string, unknown>[] = cards
      .filter((card) => !card.setName)
      .map((card) => ({
        cardId: card._id,
        productName: card.productName,
        reason: 'Card has no set name',
      }));
    const fetchedSets: Record<string, unknown>[] = [];
    let processedSetCount = 0,
      failedSetCount = 0,
      rateLimited = false;
    const map = sets.length ? await getSetNameIdMap() : {};
    for (const setName of sets) {
      if (completed.has(setName)) continue;
      if (Date.now() + 20000 >= deadline) break;
      const setCards = cards.filter((card) => card.setName === setName);
      try {
        const rows = extractPriceRows(await getCardData(setName, { fresh: true }));
        fetchedSets.push({ setName, rowsFetched: rows.length, ok: true, source: 'tcgplayer' });
        for (const card of setCards) {
          const match = findBestPriceRow(rows, card);
          if (!match) {
            unmatched.push({
              cardId: card._id,
              productName: card.productName,
              setName,
              number: card.number,
              reason: 'No matching condition and printing price',
            });
            continue;
          }
          const result = await collection.updateOne(
            { _id: card._id, userId: user.username },
            {
              $set: {
                marketPrice: match.price,
                lowPrice: parsePrice(match.row.lowPrice) ?? card.lowPrice ?? 0,
                oldPrice: card.marketPrice,
                updatedAt: new Date(),
              },
            },
          );
          await recordPriceHistoryEntry({
            cardId: card.cardId ?? null,
            setName,
            number: card.number,
            rarity: card.rarity,
            edition: card.printing,
            condition: card.condition,
            price: match.price,
          });
          updated.push({
            cardId: card._id,
            productName: card.productName,
            setName,
            number: card.number,
            newPrice: match.price,
            modifiedCount: result.modifiedCount,
          });
        }
        completed.add(setName);
        await jobs.updateOne(
          { _id: job._id },
          { $addToSet: { completedSetKeys: setName }, $set: { updatedAt: new Date() } },
        );
        processedSetCount += 1;
      } catch (error) {
        failedSetCount += 1;
        rateLimited = error instanceof HttpError && error.statusCode === 429;
        fetchedSets.push({
          setName,
          rowsFetched: 0,
          ok: false,
          source: 'remote-failed',
          error: 'TCGPlayer request failed; will retry',
        });
        unmatched.push(
          ...setCards.map((card) => ({
            cardId: card._id,
            productName: card.productName,
            setName,
            reason: 'TCGPlayer request failed; will retry',
          })),
        );
        if (rateLimited) break;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    const remainingSetCount = sets.length - completed.size;
    const complete = remainingSetCount === 0;
    await jobs.updateOne(
      { _id: job._id },
      { $set: { status: complete ? 'complete' : 'partial', updatedAt: new Date() } },
    );
    return {
      jobId: job._id.toString(),
      updated,
      unmatched,
      updatedCount: updated.length,
      unmatchedCount: unmatched.length,
      processedSetCount,
      failedSetCount,
      fetchedSetCount: fetchedSets.length,
      fetchedSets,
      completedSetCount: completed.size,
      remainingSetCount,
      totalSetCount: sets.length,
      totalCollectionCardCount: cards.length,
      complete,
      rateLimited,
      stoppedReason: complete ? null : rateLimited ? 'rate_limited' : 'partial',
      retryAfterMs: rateLimited ? 60000 : null,
      nextAction: complete ? 'done' : 'resume',
      sourceSetCount: Object.keys(map).length,
    };
  } finally {
    await locks.deleteOne({ _id: user.username, owner });
  }
}
