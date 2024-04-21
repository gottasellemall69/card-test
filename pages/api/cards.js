// @/pages/api/cards.js
import clientPromise from '@/utils/mongo';

export default async function handler(req,res) {
  try {
    const client=await clientPromise;
    const db=client.db('cardPriceApp');
    const collection=db.collection('myCollection');

    if(req.method==='POST') {
      const {cards}=req.body;
      await collection.insertMany(cards);
      res.status(201).json({message: 'Cards saved successfully'});
    } else {
      res.status(405).json({message: 'Method Not Allowed'});
    }
  } catch(error) {
    console.error('Error saving cards:',error);
    res.status(500).json({message: 'Server error'});
  }
}
