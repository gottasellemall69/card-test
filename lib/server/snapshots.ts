import { createHash } from 'node:crypto';
import type { AnyBulkWriteOperation, Document } from 'mongodb';
import { getDatabase } from './database';
import { historyIdentity, parsePrice } from '@/lib/cards/prices';

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
  const snapshots = db.collection('cardPriceSnapshots');
  let saved = 0;
  let withoutMarketPrice = 0;
  for (let offset = 0; offset < rows.length; offset += 500) {
    const operations: AnyBulkWriteOperation<Document>[] = rows
      .slice(offset, offset + 500)
      .map((row) => {
        const snapshot = snapshotFromRow(row, set, capturedAt);
        if (snapshot.price === null) withoutMarketPrice += 1;
        return {
          updateOne: {
            filter: { signature: snapshot.signature, day: snapshot.day },
            update: { $set: snapshot },
            upsert: true,
          },
        };
      });
    if (operations.length) {
      await snapshots.bulkWrite(operations, { ordered: false });
      saved += operations.length;
    }
  }
  return { saved, withoutMarketPrice };
}
