import { apiRoute } from '@/lib/server/http';
import updateCollectionPrices from '@/lib/server/updateCollectionPrices';

export default apiRoute({ methods: ['POST'], auth: true }, async (req, res) => {
  const result = await updateCollectionPrices(req.auth.token);
  return res
    .status(200)
    .json({
      message: result.complete
        ? 'Prices updated successfully'
        : 'Price update saved. Resume to finish.',
      result,
    });
});
export const config = { maxDuration: 300 };
