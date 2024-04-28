import {MongoClient, ObjectId} from 'mongodb'
import clientPromise from '@/utils/mongo'

export default async function handler(req, res) {
  const client=await clientPromise
  const collection=client.db('cardPriceApp').collection('myCollection')

  switch(req.method) {
    case 'GET':
      try {
        // Aggregation pipeline to group and calculate quantity of unique documents
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
              'uniqueDocs': {'$addToSet': '$$ROOT'},
            },
          },
          {
            '$addFields': {
              'quantity': {'$size': '$uniqueDocs'},
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
        ]

        const cursor=collection.aggregate(agg)
        const result=await cursor.toArray()

        // Modify the result to include the _id field
        const modifiedResult=result.map((item) => {
          return {
            _id: item._id.toString(), // Convert ObjectId to string
            ...item
          }
        })

        res.status(200).json(modifiedResult)

      } catch(error) {
        console.error('Error executing aggregation query:', error)
        res.status(500).json({message: 'Server error'})
      }
  }
}