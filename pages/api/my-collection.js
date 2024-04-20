// @/pages/api/my-collection.js
import {MongoClient} from 'mongodb';

const uri=process.env.MONGODB_URI;
const dbName='cardPriceApp';

export default async function handler(req,res) {
  if(req.method==='GET') {
    try {
      const client=await MongoClient.connect(uri);
      const db=client.db(dbName);
      const collection=db.collection('myCollection'); // Replace with your collection name

      const cards=await collection.find({}).toArray();

      await client.close();

      res.status(200).json({cards});
    } catch(error) {
      console.error('Error fetching cards:',error);
      res.status(500).json({message: 'Server error'});
    }
  } else {
    res.status(405).json({message: 'Method Not Allowed'});
  }
}
