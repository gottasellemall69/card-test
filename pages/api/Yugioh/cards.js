import { apiRoute } from '@/lib/server/http';
import { getDatabase } from '@/lib/server/database';
import { HttpError } from '@/lib/server/errors';
import { coerceNumberField, coerceStringField, safeImageUrl } from '@/utils/securityValidators';

const identityFields = ['productName', 'setName', 'number', 'printing', 'rarity', 'condition'];
export default apiRoute({ methods: ['POST'], auth: true }, async (req, res) => {
  const input = req.body?.cards;
  if (!Array.isArray(input) || !input.length) throw new HttpError(400, 'No cards provided.');
  if (input.length > 5000) throw new HttpError(413, 'A maximum of 5000 cards may be submitted.');
  const grouped = new Map();
  // Validate the entire request before writing anything; malformed rows are never silently dropped.
  for (const card of input) {
    if (!card || typeof card !== 'object' || Array.isArray(card))
      throw new HttpError(400, 'Invalid card');
    const clean = Object.fromEntries(
      identityFields.map((field) => [
        field,
        coerceStringField(card[field] ?? '', {
          maxLength: 256,
          allowEmpty: !['productName', 'setName'].includes(field),
        }),
      ]),
    );
    Object.assign(clean, {
      marketPrice: coerceNumberField(card.marketPrice ?? 0),
      lowPrice: coerceNumberField(card.lowPrice ?? 0),
      quantity: coerceNumberField(card.quantity ?? 1, { min: 0, max: 1000, integer: true }),
      cardId: card.cardId == null ? null : coerceStringField(card.cardId, { maxLength: 128 }),
      remoteImageUrl: safeImageUrl(card.remoteImageUrl),
    });
    const key = JSON.stringify(identityFields.map((field) => clean[field]));
    const prior = grouped.get(key);
    if (prior) {
      prior.quantity += clean.quantity;
      if (prior.quantity > 1000)
        throw new HttpError(400, 'A card quantity cannot exceed 1000 in one request');
    } else grouped.set(key, clean);
  }
  const userId = req.auth.decoded.username;
  const now = new Date();
  const operations = [...grouped.values()].map((card) => ({
    updateOne: {
      filter: {
        userId,
        ...Object.fromEntries(identityFields.map((field) => [field, card[field]])),
      },
      update: {
        $inc: { quantity: card.quantity },
        $set: {
          updatedAt: now,
          ...(card.cardId ? { cardId: card.cardId } : {}),
          ...(card.remoteImageUrl ? { remoteImageUrl: card.remoteImageUrl } : {}),
        },
        $setOnInsert: {
          marketPrice: card.marketPrice,
          lowPrice: card.lowPrice,
          oldPrice: null,
          folderIds: [],
          createdAt: now,
        },
      },
      upsert: true,
    },
  }));
  const db = await getDatabase();
  await db.collection('myCollection').bulkWrite(operations, { ordered: true });
  return res.status(201).json({ message: 'Cards saved/updated successfully' });
});
export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };
