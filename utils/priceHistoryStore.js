import { getDatabase } from '@/lib/server/database';
import { coerceNumberField } from '@/utils/securityValidators';
const normalize = (value) => String(value ?? '').trim();
export const buildHistoryFilter = ({
  cardId,
  setName,
  number,
  rarity,
  edition,
  condition,
  userId,
}) => ({
  cardId: normalize(cardId) || null,
  setName: normalize(setName),
  number: normalize(number),
  rarity: normalize(rarity),
  edition: normalize(edition) || 'Unknown Edition',
  ...(condition ? { condition: normalize(condition) } : {}),
  userId: userId || null,
});
export async function recordPriceHistoryEntry({ price, date = new Date(), ...identity }) {
  const numeric = coerceNumberField(price);
  const timestamp = new Date(date);
  if (Number.isNaN(timestamp.getTime())) throw new Error('Invalid history date');
  const dayStart = new Date(timestamp.toISOString().slice(0, 10));
  const dayEnd = new Date(dayStart.getTime() + 86400000);
  const db = await getDatabase();
  const entry = { date: timestamp, price: numeric };
  // One point per day, atomically, with bounded legacy document size.
  return db.collection('priceHistory').updateOne(
    buildHistoryFilter(identity),
    [
      {
        $set: {
          ...Object.fromEntries(
            Object.entries(buildHistoryFilter(identity)).map(([key, value]) => [
              key,
              { $literal: value },
            ]),
          ),
          history: {
            $slice: [
              {
                $concatArrays: [
                  {
                    $filter: {
                      input: { $ifNull: ['$history', []] },
                      as: 'point',
                      cond: {
                        $or: [
                          { $lt: ['$$point.date', dayStart] },
                          { $gte: ['$$point.date', dayEnd] },
                        ],
                      },
                    },
                  },
                  { $literal: [entry] },
                ],
              },
              -1825,
            ],
          },
          lastPrice: numeric,
          updatedAt: timestamp,
          createdAt: { $ifNull: ['$createdAt', timestamp] },
        },
      },
    ],
    { upsert: true },
  );
}
export async function fetchPriceHistory(filter) {
  const db = await getDatabase();
  const doc = await db
    .collection('priceHistory')
    .findOne(filter, { projection: { history: 1, _id: 0 } });
  return (doc?.history || [])
    .filter(
      (point) =>
        Number.isFinite(Number(point.price)) && !Number.isNaN(new Date(point.date).getTime()),
    )
    .map((point) => ({ date: new Date(point.date).toISOString(), price: Number(point.price) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
export async function mergeLegacyHistory({ filter, entries = [] }) {
  for (const entry of entries) await recordPriceHistoryEntry({ ...filter, ...entry });
}
