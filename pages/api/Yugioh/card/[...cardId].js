import { apiRoute } from '@/lib/server/http';
import { fetchYgoCards } from '@/lib/server/cardApi';
import { formatYugiohCardData } from '@/utils/formatYugiohCardData';

async function handler(req, res) {
  const { cardId } = req.query;
  const normalizedCardId = Array.isArray(cardId) ? cardId[0] : cardId;

  if (!normalizedCardId) {
    return res.status(400).json({ error: 'Missing card identifier' });
  }

  try {
    const data = { data: await fetchYgoCards({ id: normalizedCardId }) };

    if (!Array.isArray(data?.data) || data.data.length === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const card = data.data?.[0];
    res.status(200).json(formatYugiohCardData(card));
  } catch (error) {
    if (error?.statusCode) throw error;
    console.error('Card API request failed');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default apiRoute({ methods: ['GET'], auth: false }, handler);
