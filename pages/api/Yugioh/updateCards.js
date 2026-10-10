import { ObjectId } from 'mongodb';
import { apiRoute } from '@/lib/server/http';
import { getDatabase } from '@/lib/server/database';
import { HttpError } from '@/lib/server/errors';
import { coerceNumberField, coerceStringField } from '@/utils/securityValidators';

const numericFields = new Set(['quantity', 'marketPrice', 'lowPrice', 'oldPrice']);
const textFields = new Set(['condition', 'printing', 'rarity']);
export default apiRoute({ methods: ['PATCH'], auth: true }, async (req, res) => {
  const { cardId, field, value } = req.body || {};
  if (typeof cardId !== 'string' || !/^[a-f\d]{24}$/i.test(cardId))
    throw new HttpError(400, 'Invalid card identifier');
  if (!numericFields.has(field) && !textFields.has(field))
    throw new HttpError(400, 'Invalid update field');
  const sanitized = numericFields.has(field)
    ? coerceNumberField(value, {
        min: 0,
        max: field === 'quantity' ? 1000000 : 1e9,
        integer: field === 'quantity',
      })
    : coerceStringField(value, { maxLength: 128, allowEmpty: true });
  const db = await getDatabase();
  const result = await db
    .collection('myCollection')
    .updateOne(
      { _id: new ObjectId(cardId), userId: req.auth.decoded.username },
      { $set: { [field]: sanitized, updatedAt: new Date() } },
    );
  if (!result.matchedCount) throw new HttpError(404, 'Card not found');
  return res.status(200).json({ message: 'Card updated successfully' });
});
