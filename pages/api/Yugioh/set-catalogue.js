import { apiRoute } from '@/lib/server/http';
import { getSetCatalogue } from '@/lib/server/cardApi';
export default apiRoute({ methods: ['GET'] }, async (req, res) =>
  res.status(200).json(await getSetCatalogue()),
);
