// pages/api/aggregation.js
import {MongoClient} from 'mongodb'

export default async function handler(req, res) {
  try {
    const agg=[
      {
        '$group': {
          '_id': {
            'productName': '$productName',
            'setName': '$setName',
            'number': '$number',
            'printing': '$printing',
            'rarity': '$rarity',
            'condition': '$condition',
          },
          'marketPrice': {'$max': '$marketPrice'},
          'uniqueDocs': {'$addToSet': '$$ROOT'}, // Keep track of unique documents within each group
        },
      },
      {
        '$addFields': {
          'quantity': {'$size': '$uniqueDocs'}, // Calculate the quantity of unique documents within each group
        },
      },
      {
        '$project': {
          '_id': 0,
          'productName': '$_id.productName',
          'setName': '$_id.setName',
          'number': '$_id.number',
          'printing': '$_id.printing',
          'rarity': '$_id.rarity',
          'condition': '$_id.condition',
          'marketPrice': 1,
          'quantity': 1,
        },
      },
    ]

    const client=await MongoClient.connect(process.env.MONGODB_URI)
    const coll=client.db('cardPriceApp').collection('myCollection')
    const cursor=coll.aggregate(agg)
    const result=await cursor.toArray()
    await client.close()

    res.status(200).json(result)
  } catch(error) {
    console.error('Error executing aggregation query:', error)
    res.status(500).json({message: 'Server error'})
  }
}
