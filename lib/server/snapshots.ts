import { createHash } from 'node:crypto';
import type { AnyBulkWriteOperation } from 'mongodb';
import { getDatabase } from './database';
import { historyIdentity, parsePrice } from '@/lib/cards/prices';

export const PRICE_SERIES_COLLECTION = 'cardPriceSeries';
const DEFAULT_HISTORY_POINTS = 90;

export type PriceHistoryPoint = { d: Date; p: number };
export type PriceSeriesDocument = {
  _id: string;
  setNameKey: string;
  numberKey: string;
  rarityKey: string;
  editionKey: string;
  conditionKey: string;
  source: 'tcgplayer';
  updatedAt: Date;
  points: PriceHistoryPoint[];
};

export function getHistoryPointLimit() {
  const configured = Number.parseInt(process.env.PRICE_HISTORY_POINTS || '', 10);
  return Number.isFinite(configured) && configured >= 7 && configured <= 1825
    ? configured
    : DEFAULT_HISTORY_POINTS;
}

export function snapshotFromRow(
  row: Record<string, unknown>,
  set: { name: string; setNameId: number },
  capturedAt = new Date(),
) {
  const identity = historyIdentity({
    setName: row.set || set.name,
    number: row.number,
    rarity: row.rarity,
    edition: row.printing,
    condition: row.condition,
  });
  const productId = String(row.productID ?? row.productId ?? '');
  const signature = createHash('sha256')
    .update(
      JSON.stringify({
        ...identity,
        // Product identity keeps alternate products with the same printed number separate.
        product: productId || String(row.productName || ''),
      }),
    )
    .digest('hex');
  const day = capturedAt.toISOString().slice(0, 10);
  return {
    signature,
    day,
    date: capturedAt,
    ...identity,
    productName: String(row.productName || ''),
    productId,
    productConditionId: String(row.productConditionID ?? ''),
    setName: String(row.set || set.name),
    number: String(row.number || ''),
    rarity: String(row.rarity || ''),
    edition: String(row.printing || 'Unknown Edition'),
    condition: String(row.condition || 'Near Mint'),
    price: parsePrice(row.marketPrice),
    lowPrice: parsePrice(row.lowPrice),
    source: 'tcgplayer',
    sourceSetId: set.setNameId,
  };
}

export async function saveSetSnapshots(
  rows: Record<string, unknown>[],
  set: { name: string; setNameId: number },
  capturedAt = new Date(),
) {
  const db = await getDatabase();
  const series = db.collection<PriceSeriesDocument>(PRICE_SERIES_COLLECTION);
  const historyPointLimit = getHistoryPointLimit();
  let saved = 0;
  let withoutMarketPrice = 0;
  for (let offset = 0; offset < rows.length; offset += 500) {
    const operations: AnyBulkWriteOperation<PriceSeriesDocument>[] = rows
      .slice(offset, offset + 500)
      .flatMap((row): AnyBulkWriteOperation<PriceSeriesDocument>[] => {
        const snapshot = snapshotFromRow(row, set, capturedAt);
        if (snapshot.price === null) {
          withoutMarketPrice += 1;
          return [];
        }
        const dayStart = new Date(`${snapshot.day}T00:00:00.000Z`);
        const dayEnd = new Date(dayStart.getTime() + 86400000);
        const point: PriceHistoryPoint = { d: snapshot.date, p: snapshot.price };
        return [{
          updateOne: {
            filter: { _id: snapshot.signature },
            update: [
              {
                $set: {
                  setNameKey: { $literal: snapshot.setNameKey },
                  numberKey: { $literal: snapshot.numberKey },
                  rarityKey: { $literal: snapshot.rarityKey },
                  editionKey: { $literal: snapshot.editionKey },
                  conditionKey: { $literal: snapshot.conditionKey },
                  source: 'tcgplayer',
                  updatedAt: snapshot.date,
                  points: {
                    $slice: [
                      {
                        $concatArrays: [
                          {
                            $filter: {
                              input: { $ifNull: ['$points', []] },
                              as: 'point',
                              cond: {
                                $or: [
                                  { $lt: ['$$point.d', dayStart] },
                                  { $gte: ['$$point.d', dayEnd] },
                                ],
                              },
                            },
                          },
                          [{ $literal: point }],
                        ],
                      },
                      -historyPointLimit,
                    ],
                  },
                },
              },
            ],
            upsert: true,
          },
        }];
      });
    if (operations.length) {
      await series.bulkWrite(operations, { ordered: false });
      saved += operations.length;
    }
  }
  return { saved, withoutMarketPrice };
}

export async function ensurePriceSeriesIndexes() {
  const db = await getDatabase();
  await db.collection<PriceSeriesDocument>(PRICE_SERIES_COLLECTION).createIndex({
    setNameKey: 1,
    numberKey: 1,
    rarityKey: 1,
    editionKey: 1,
    conditionKey: 1,
  });
}
