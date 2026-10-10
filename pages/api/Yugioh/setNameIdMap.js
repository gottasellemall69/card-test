import { apiRoute } from '@/lib/server/http';
import { getSetNameIdMap } from '@/lib/server/cardApi';

async function handler(req, res) {
  const setNameIdMap = await getSetNameIdMap();
  if (!setNameIdMap) {
    res.status(500).json({ message: 'Error fetching set name ID map' });
  } else {
    res.status(200).json(setNameIdMap);
  }
}

export default apiRoute({ methods: ['GET'], auth: false }, handler);
