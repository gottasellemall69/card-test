import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      await client.connect();
      const database = client.db('cardPriceApp');
      const cards = database.collection('myCollection');

      // Get the total number of cards
      const aggregationPipeline = [
        {
          '$group': {
            '_id': null,
            'totalQuantity': { '$sum': '$quantity' }
          }
        },
        {
          '$project': {
            'totalQuantity': 1

          }
        }
      ];
      const aggregationResult = await cards.aggregate(aggregationPipeline).toArray();
      const totalQuantity = aggregationResult[0] ? aggregationResult[0].totalQuantity : 0;

      res.status(200).json({ totalQuantity });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Unable to fetch card count' });
    }
  }
}
