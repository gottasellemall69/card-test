import { apiRoute } from '@/lib/server/http';
import { requireUser } from '@/lib/server/auth';
import { HttpError } from '@/lib/server/errors';
import { canManageTracking, getTrackingStatus, runPriceTracking } from '@/lib/server/priceTracker';

export default apiRoute({ methods: ['GET', 'POST'], limit: 60 }, async (req, res) => {
  if (req.method === 'GET') return res.status(200).json(await getTrackingStatus());
  const auth = await requireUser(req, res);
  if (!canManageTracking(auth.decoded.username))
    throw new HttpError(403, 'Administrator access is required');
  return res
    .status(200)
    .json(await runPriceTracking({ restart: req.body?.restart === true, maxDurationMs: 45000 }));
});
export const config = { maxDuration: 60, api: { bodyParser: { sizeLimit: '1kb' } } };
