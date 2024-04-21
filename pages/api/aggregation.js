// pages/api/aggregation.js
import {MongoClient} from 'mongodb';

export default async function handler(req,res) {
  try {
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
          }
        }
      },{
        '$project': {
          '_id': 0,
          'objectId': '$_id',
          'productName': {
            '$cond': {
              'if': {
                '$eq': [
                  {
                    '$size': '$productName'
                  },1
                ]
              },
              'then': {
                '$arrayElemAt': [
                  '$productName',0
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
                  },1
                ]
              },
              'then': {
                '$arrayElemAt': [
                  '$setName',0
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
                  },1
                ]
              },
              'then': {
                '$arrayElemAt': [
                  '$number',0
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
                  },1
                ]
              },
              'then': {
                '$arrayElemAt': [
                  '$printing',0
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
                  },1
                ]
              },
              'then': {
                '$arrayElemAt': [
                  '$rarity',0
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
                  },1
                ]
              },
              'then': {
                '$arrayElemAt': [
                  '$condition',0
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
                  },1
                ]
              },
              'then': {
                '$arrayElemAt': [
                  '$marketPrice',0
                ]
              },
              'else': null
            }
          }
        }
      }
    ];

    const client=await MongoClient.connect(process.env.MONGODB_URI);
    const coll=client.db('cardPriceApp').collection('myCollection');
    const cursor=coll.aggregate(agg);
    const result=await cursor.toArray();
    await client.close();

    res.status(200).json(result);
  } catch(error) {
    console.error('Error executing aggregation query:',error);
    res.status(500).json({message: 'Server error'});
  }
}
