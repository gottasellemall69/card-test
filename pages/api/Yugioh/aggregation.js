import {MongoClient} from 'mongodb';

export default async function handler(req, res) {
  const client=await MongoClient.connect(process.env.MONGODB_URI);
  const collection=client.db('cardPriceApp').collection('myCollection');
  try {
    const agg=[

      {
        '$group': {
          '_id': {
            'marketPrice': '$marketPrice',
            'productName': '$productName'
          },
          'quantity': '$quantity',
          'document': {
            '$push': '$$ROOT'
          }
        }
      }, {
        '$unwind': '$document'
      }, {
        '$set': {
          'document.quantity': '$quantity'
        }
      }, {
        '$replaceRoot': {
          'newRoot': '$document'
        }
      },

      {
        '$sort': {'_id': 1}

      },
    ]


    const cursor=collection.aggregate(agg);
    const result=await cursor.toArray();

    // Modify the result to include the _id field
    const modifiedResult=result.map((item => {
      return {
        _id: JSON.stringify(item._id), // Convert ObjectId to string
        ...item
      }
    }))

    res.status(200).json(modifiedResult);

  } catch(error) {
    console.error('Error executing aggregation query:', error);
    res.status(500).json({message: 'Server error'});
  }
}
