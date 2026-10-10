import { apiRoute } from '@/lib/server/http';
import { getDatabase } from '@/lib/server/database';
import { getPriceHistories, identityKey } from '@/lib/server/history';
import { historyIdentity, parsePrice } from '@/lib/cards/prices';
import { collectionValues } from '@/lib/cards/history';

export default apiRoute({ methods: ['GET'], auth: true }, async (req, res) => {
  const db = await getDatabase();
  const cards = await db
    .collection('myCollection')
    .find({ userId: req.auth.decoded.username })
    .toArray();
  const active = cards.filter(
    (card) => Number.isFinite(Number(card.quantity)) && Number(card.quantity) > 0,
  );
  const inputs = active.map((card) => ({ ...card, edition: card.printing }));
  const histories = await getPriceHistories(inputs, req.auth.decoded.username);
  const holdings = active.map((card, index) => {
    const history = histories.get(identityKey(historyIdentity(inputs[index]))) || [];
    const price = parsePrice(card.marketPrice);
    return {
      quantity: Number(card.quantity),
      history:
        history.length || price === null ? history : [{ date: new Date().toISOString(), price }],
    };
  });
  return res.status(200).json({ history: collectionValues(holdings) });
});
