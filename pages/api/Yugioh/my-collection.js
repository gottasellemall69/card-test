import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const collection = client.db('cardPriceApp').collection('myCollection');

    switch (req.method) {
      case 'GET':
        const agg = [
          {
            '$project': {
              '_id': '$_id',
              'productName': '$productName',
              'setName': '$setName',
              'number': '$number',
              'printing': '$printing',
              'rarity': '$rarity',
              'condition': '$condition',
              'marketPrice': '$marketPrice',
              'quantity': '$quantity'
            }
          },
          {
            '$sort': {
              '$_id': 1
            }
          }
        ]
        [
          {
            '$sort': {
              '_id': 1
            }
          }, {
            '$group': {
              '$_id': 1,
              'items': {
                '$push': '$$ROOT'
              }
            }
          }, {
            '$project': {
              'totalPages': {
                '$ceil': {
                  '$divide': [
                    {
                      '$size': '$items'
                    }, 12
                  ]
                }
              },
              'items': 1
            }
          }, {
            '$unwind': {
              'path': '$items',
              'includeArrayIndex': 'itemIndex'
            }
          }, {
            '$group': {
              '$_id': {
                '$floor': {
                  '$divide': [
                    '$itemIndex', 12
                  ]
                }
              },
              'pageItems': {
                '$push': '$items'
              }
            }
          }, {
            '$project': {
              'page': '$_id',
              'items': '$pageItems'
            }
          }, {
            '$sort': {
              'page': 1
            }
          }
        ];
        const cursor = collection.aggregate(agg);
        const result = await cursor.toArray();
        const modifiedResult = result.map((item) => {
          return {
            _id: JSON.stringify(item._id),
            ...item
          };
        });

        res.status(200).json(modifiedResult);
    }
  } catch (error) {
    console.error('Error executing aggregation query:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    await client.close();
  }
}
