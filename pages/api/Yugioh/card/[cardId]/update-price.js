import { apiRoute } from '@/lib/server/http';
import { recordPriceHistoryEntry } from '@/utils/priceHistoryStore';
import { coerceNumberField, coerceStringField } from '@/utils/securityValidators';
export default apiRoute({ methods: ['POST'], auth: true }, async (req, res) => {
  const input = req.body || {};
  const entry = Object.fromEntries(
    ['cardId', 'setName', 'number', 'rarity', 'edition'].map((key) => [
      key,
      coerceStringField(input[key], { maxLength: 256 }),
    ]),
  );
  const condition = coerceStringField(input.condition || 'Near Mint', { maxLength: 128 });
  await recordPriceHistoryEntry({
    ...entry,
    condition,
    price: coerceNumberField(input.newPrice),
    userId: req.auth.decoded.username,
  });
  return res.status(200).json({ message: 'Price updated successfully' });
});
