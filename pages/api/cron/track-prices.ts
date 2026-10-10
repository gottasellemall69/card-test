import { timingSafeEqual } from 'node:crypto';
import { apiRoute } from '@/lib/server/http';
import { HttpError } from '@/lib/server/errors';
import { runPriceTracking } from '@/lib/server/priceTracker';

export default apiRoute({ methods: ['GET'], scope: 'price-cron', limit: 20 }, async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16)
    throw new HttpError(503, 'Cron authentication is not configured');
  const received = Buffer.from(req.headers.authorization || '');
  const expected = Buffer.from(`Bearer ${secret}`);
  if (received.length !== expected.length || !timingSafeEqual(received, expected))
    throw new HttpError(401, 'Unauthorized');
  const result = await runPriceTracking({ start: req.query.start === '1', maxDurationMs: 240000 });
  return res.status(200).json(result);
});
export const config = { maxDuration: 300 };
