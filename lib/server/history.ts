import { getDatabase } from './database';
import { historyIdentity, type PriceIdentity } from '@/lib/cards/prices';
import { mergeDailyPrices } from '@/lib/cards/history';

export const identityKey = (identity: ReturnType<typeof historyIdentity>) =>
  JSON.stringify(identity);

export async function getPriceHistories(inputs: PriceIdentity[], username?: string) {
  const db = await getDatabase();
  const points = new Map<string, { date: unknown; price: unknown }[]>();
  const identities = new Map(inputs.map((input) => [identityKey(historyIdentity(input)), input]));
  const ownership = [
    { userId: { $exists: false } },
    { userId: null },
    ...(username ? [{ userId: username }] : []),
  ];
  const entries = [...identities.entries()];
  for (let offset = 0; offset < entries.length; offset += 250) {
    const batch = entries.slice(offset, offset + 250);
    const snapshots = await db
      .collection('cardPriceSnapshots')
      .find(
        { $or: batch.map(([, input]) => historyIdentity(input)) },
        {
          projection: {
            setNameKey: 1,
            numberKey: 1,
            rarityKey: 1,
            editionKey: 1,
            conditionKey: 1,
            date: 1,
            price: 1,
            _id: 0,
          },
        },
      )
      .toArray();
    const legacy = await db
      .collection('priceHistory')
      .find({
        $and: [
          {
            $or: batch.map(([, input]) => ({
              setName: String(input.setName || '').trim(),
              number: String(input.number || '').trim(),
              rarity: String(input.rarity || '').trim(),
              edition: String(input.edition || 'Unknown Edition').trim(),
            })),
          },
          { $or: ownership },
        ],
      })
      .toArray();
    for (const snapshot of snapshots) {
      const key = identityKey({
        setNameKey: snapshot.setNameKey,
        numberKey: snapshot.numberKey,
        rarityKey: snapshot.rarityKey,
        editionKey: snapshot.editionKey,
        conditionKey: snapshot.conditionKey,
      });
      const history = points.get(key) || [];
      history.push({ date: snapshot.date, price: snapshot.price });
      points.set(key, history);
    }
    for (const doc of legacy) {
      const key = identityKey(
        historyIdentity({
          setName: doc.setName,
          number: doc.number,
          rarity: doc.rarity,
          edition: doc.edition,
          condition: doc.condition,
        }),
      );
      if (!identities.has(key)) continue;
      points.set(key, [
        ...(Array.isArray(doc.history) ? doc.history : []),
        ...(points.get(key) || []),
      ]);
    }
  }
  return new Map(entries.map(([key]) => [key, mergeDailyPrices(points.get(key) || [])]));
}
