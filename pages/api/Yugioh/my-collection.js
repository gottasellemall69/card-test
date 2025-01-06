// pages\api\Yugioh\my-collection.js
import { MongoClient } from "mongodb";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  // Check if the request includes an Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1]; // Extract the token from the header

  let decodedToken;
  try {
    // Verify the token
    decodedToken = jwt.verify(token, process.env.JWT_SECRET); // Ensure `JWT_SECRET` is set in your .env file
  } catch (error) {
    console.error("Invalid token:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }

  const userId = decodedToken.username; // Use the username from the token payload as the user identifier

  const client=new MongoClient(process.env.MONGODB_URI)
  try {
    await client.connect();
    const collection = client.db('cardPriceApp').collection('myCollection');

    switch (req.method) {
      case 'GET':
        const agg = [
          {
            '$match': userId, // Only fetch documents for the logged-in user
          },
          {
            '$project': {
              '_id': '$_id',
              'productName': '$productName',
              'setName': '$setName',
              'number': '$number',
              'printing': '$printing',
              'rarity': '$rarity',
              'condition': '$condition',
              'oldPrice': '$oldPrice',
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