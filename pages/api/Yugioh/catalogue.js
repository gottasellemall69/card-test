import { apiRoute } from '@/lib/server/http';
import { fetchCardData } from '@/lib/server/cardApi';
export default apiRoute({ methods: ['GET'] }, async (req, res) =>
  res.status(200).json(await fetchCardData()),
);
