import { apiRoute, queryString } from '@/lib/server/http';
import { getPricesBySetId, getSetNameIdMap } from '@/lib/server/cardApi';
import { HttpError } from '@/lib/server/errors';

export default apiRoute({ methods: ['GET'] }, async (req, res) => {
  const value = queryString(req.query.setNameId, 'set identifier', 10);
  if (!/^[1-9]\d*$/.test(value)) throw new HttpError(400, 'Invalid set identifier');
  const id = Number(value);
  if (!Object.values(await getSetNameIdMap()).includes(id))
    throw new HttpError(404, 'Set not found');
  return res.status(200).json(await getPricesBySetId(id));
});
