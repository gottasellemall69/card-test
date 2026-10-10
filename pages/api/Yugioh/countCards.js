import { apiRoute } from '@/lib/server/http';
import { getDatabase } from '@/lib/server/database';
export default apiRoute({ methods: ['GET'], auth: true }, async (req, res) => {
  const db = await getDatabase();
  const cards = await db
    .collection('myCollection')
    .find(
      { userId: req.auth.decoded.username },
      {
        projection: { quantity: 1, marketPrice: 1 },
      },
    )
    .toArray();
  const totals = cards.reduce(
    (total, card) => {
      const quantity = Number.isFinite(Number(card.quantity))
        ? Math.max(0, Number(card.quantity))
        : 0;
      const price = Number.isFinite(Number(card.marketPrice))
        ? Math.max(0, Number(card.marketPrice))
        : 0;
      total.totalQuantity += quantity;
      total.totalMarketPrice += price * quantity;
      return total;
    },
    { totalQuantity: 0, totalMarketPrice: 0 },
  );
  return res.status(200).json({ ...totals, totalMarketPrice: totals.totalMarketPrice.toFixed(2) });
});
