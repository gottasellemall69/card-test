// @/pages/api/my-collection.js
import clientPromise from '@/utils/mongo';

export default async function handler(req,res) {
  try {
    const client=await clientPromise;
    const db=client.db('cardPriceApp');
    const collection=db.collection('myCollection');

    if(req.method==='GET') {
      const cards=await collection.find({}).toArray();
      res.status(200).json(cards);
    } else {
      res.status(405).json({message: 'Method Not Allowed'});
    }
  } catch(error) {
    console.error('Error fetching cards:',error);
    res.status(500).json({message: 'Server error'});
  }
}
