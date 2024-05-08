// pages/api/aggregation.js
import {MongoClient} from 'mongodb'

export default async function handler(req, res) {
  const client=await MongoClient.connect(process.env.MONGODB_URI)
  const collection=client.db('cardPriceApp').collection('myCollection')
  try {
    const agg=[
      {
        '$group': {
          '_id': '$_id', // Include the _id field explicitly
          'productName': {'$first': '$productName'},
          'setName': {'$first': '$setName'},
          'number': {'$first': '$number'},
          'printing': {'$first': '$printing'},
          'rarity': {'$first': '$rarity'},
          'condition': {'$first': '$condition'},
          'marketPrice': {'$max': '$marketPrice'},
          'quantity': {'$sum': 1}, // Keep track of unique documents within each group
        },
      },



      {
        '$project': {
          '_id': 1, // Include _id field
          'productName': 1,
          'setName': 1,
          'number': 1,
          'printing': 1,
          'rarity': 1,
          'condition': 1,
          'marketPrice': 1,
          'quantity': {'$sum': 1},
        },
      },
      {
        '$sort': {'_id': 1}

      },
    ]


    const cursor=collection.aggregate(agg)
    const result=await cursor.toArray()

    // Modify the result to include the _id field
    const modifiedResult=result.map((item => {
      return {
        _id: JSON.stringify(item._id), // Convert ObjectId to string
        ...item
      }
    }))

    res.status(200).json(modifiedResult)

  } catch(error) {
    console.error('Error executing aggregation query:', error)
    res.status(500).json({message: 'Server error'})
  }
}
