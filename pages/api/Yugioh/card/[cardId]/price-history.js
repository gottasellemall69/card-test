import { apiRoute, queryString } from '@/lib/server/http';
import { getSessionUser } from '@/lib/server/auth';
import { historyIdentity } from '@/lib/cards/prices';
import { getPriceHistories, identityKey } from '@/lib/server/history';

export default apiRoute({ methods: ['GET'] }, async (req, res) => {
  const cardId = queryString(req.query.cardId, 'card identifier', 128);
  const input = {
    setName: queryString(req.query.set, 'set'),
    number: queryString(req.query.number, 'number', 128),
    rarity: queryString(req.query.rarity, 'rarity', 128),
    edition: queryString(req.query.edition, 'edition', 128),
    condition: req.query.condition
      ? queryString(req.query.condition, 'condition', 128)
      : 'Near Mint',
  };
  const auth = await getSessionUser(req);
  const histories = await getPriceHistories([input], auth?.decoded.username);
  return res
    .status(200)
    .json({
      cardId,
      priceHistory: histories.get(identityKey(historyIdentity(input))) || [],
      source: 'TCGPlayer daily tracking and retained history',
    });
});
