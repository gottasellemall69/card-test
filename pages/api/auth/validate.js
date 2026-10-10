import { canManageTracking } from '@/lib/server/priceTracker';
import { apiRoute } from '@/lib/server/http';
export default apiRoute({ methods: ['GET'], auth: true }, (req, res) =>
  res
    .status(200)
    .json({
      authenticated: true,
      username: req.auth.decoded.username,
      canManageTracking: canManageTracking(req.auth.decoded.username),
    }),
);
