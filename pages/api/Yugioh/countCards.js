import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      await client.connect();
      const database = client.db('cardPriceApp');
      const cards = database.collection('myCollection');

      // Aggregate the total quantity and total market price across the entire collection
      const aggregationPipeline = [
        {
          '$group': {
            '_id': null,
            'totalQuantity': { '$sum': { '$toDouble': '$quantity' } },
            'totalMarketPrice': {
              '$sum': {
                '$multiply': [
                  { '$toDouble': '$quantity' },
                  { '$toDouble': '$marketPrice' }
                ]
              }
            }
          }
        },
        {
          '$project': {
            'totalQuantity': 1,
            'totalMarketPrice': 1
          }
        }
      ];

      const aggregationResult = await cards.aggregate(aggregationPipeline).toArray();
      const totalQuantity = aggregationResult[0] ? aggregationResult[0]?.totalQuantity : 0;
      const totalMarketPrice = aggregationResult[0] ? aggregationResult[0]?.totalMarketPrice.toFixed(2) : 0;

      res.status(200).json({ totalQuantity, totalMarketPrice });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Unable to fetch card data' });
    }
  }
}
