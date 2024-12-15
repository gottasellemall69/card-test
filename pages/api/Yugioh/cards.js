import clientPromise from '@/utils/mongo';

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db('cardPriceApp');
    const collection = db.collection('myCollection');

    if (req.method === 'POST') {
      const { cards } = req.body;

      const bulkOps = cards.map((card) => ({
        updateOne: {
          filter: {
            productName: card.productName,
            setName: card.setName,
            number: card.number,
            printing: card.printing,
            rarity: card.rarity,
            condition: card.condition,
          },
          update: {
            $inc: { quantity: card.quantity },
            $set: { oldPrice: null },
            $setOnInsert: {
              marketPrice: card.marketPrice,
              priceHistory: [],
            },
          },
          upsert: true,
        },
      }));

      await collection.bulkWrite(bulkOps);

      res.status(201).json({ message: 'Cards saved/updated successfully' });
    } else {
      res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Error saving/updating cards:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
