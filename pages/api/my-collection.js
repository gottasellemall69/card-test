import {MongoClient, ObjectId} from 'mongodb'

export default async function handler(req, res) {
  const client=await MongoClient.connect(process.env.MONGODB_URI)
  const collection=client.db('cardPriceApp').collection('myCollection')

  switch(req.method) {
    case 'GET':
      try {
        // Aggregation pipeline to group and calculate quantity of unique documents
        const agg=[
          {
            '$group': {
              '_id': '$_id',
              'productName': {
                '$addToSet': '$productName'
              },
              'setName': {
                '$addToSet': '$setName'
              },
              'number': {
                '$addToSet': '$number'
              },
              'printing': {
                '$addToSet': '$printing'
              },
              'rarity': {
                '$addToSet': '$rarity'
              },
              'condition': {
                '$addToSet': '$condition'
              },
              'marketPrice': {
                '$addToSet': '$marketPrice'
              },
              'quantity': {
                '$sum': 1


              }
            }
          }, {
            '$project': {
              '_id': '$_id',
              'productName': {
                '$cond': {
                  'if': {
                    '$eq': [
                      {
                        '$size': '$productName'
                      }, 1
                    ]
                  },
                  'then': {
                    '$arrayElemAt': [
                      '$productName', 0
                    ]
                  },
                  'else': null
                }
              },
              'setName': {
                '$cond': {
                  'if': {
                    '$eq': [
                      {
                        '$size': '$setName'
                      }, 1
                    ]
                  },
                  'then': {
                    '$arrayElemAt': [
                      '$setName', 0
                    ]
                  },
                  'else': null
                }
              },
              'number': {
                '$cond': {
                  'if': {
                    '$eq': [
                      {
                        '$size': '$number'
                      }, 1
                    ]
                  },
                  'then': {
                    '$arrayElemAt': [
                      '$number', 0
                    ]
                  },
                  'else': null
                }
              },
              'printing': {
                '$cond': {
                  'if': {
                    '$eq': [
                      {
                        '$size': '$printing'
                      }, 1
                    ]
                  },
                  'then': {
                    '$arrayElemAt': [
                      '$printing', 0
                    ]
                  },
                  'else': null
                }
              },
              'rarity': {
                '$cond': {
                  'if': {
                    '$eq': [
                      {
                        '$size': '$rarity'
                      }, 1
                    ]
                  },
                  'then': {
                    '$arrayElemAt': [
                      '$rarity', 0
                    ]
                  },
                  'else': null
                }
              },
              'condition': {
                '$cond': {
                  'if': {
                    '$eq': [
                      {
                        '$size': '$condition'
                      }, 1
                    ]
                  },
                  'then': {
                    '$arrayElemAt': [
                      '$condition', 0
                    ]
                  },
                  'else': null
                }
              },
              'marketPrice': {
                '$cond': {
                  'if': {
                    '$eq': [
                      {
                        '$size': '$marketPrice'
                      }, 1
                    ]
                  },
                  'then': {
                    '$arrayElemAt': [
                      '$marketPrice', 0
                    ]
                  },
                  'else': null
                }
              },
              'quantity': 1


            }
          }, {
            '$sort':
            {
              '_id': 1
            }

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
      await client.close()
  }
}