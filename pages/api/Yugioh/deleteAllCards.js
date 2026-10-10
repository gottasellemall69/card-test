import { apiRoute } from '@/lib/server/http';
import clientPromise from '@/utils/mongo';
import { ensureSafeUserId } from '@/utils/securityValidators.js';

async function handler(req, res) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const auth = req.auth;

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE || 'cardPriceApp');
    const collection = db.collection('myCollection');
    const safeUserId = ensureSafeUserId(auth.decoded.username);

    const result = await collection.deleteMany({ userId: safeUserId });

    if (result.deletedCount > 0) {
      return res.status(200).json({ message: 'All cards deleted successfully' });
    }

    return res.status(404).json({ message: 'No cards found to delete' });
  } catch (error) {
    if (error?.statusCode) throw error;
    console.error('Card API request failed');
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export default apiRoute({ methods: ['DELETE'], auth: true }, handler);
