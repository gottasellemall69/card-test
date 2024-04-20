'use client';
// @/pages/api/cards.js
import {MongoClient} from 'mongodb';

const uri=process.env.MONGODB_URI;
const dbName='cardPriceApp';

export default async function handler(req,res) {
  if(req.method==='POST') {
    try {
      const client=await MongoClient.connect(uri);
      const db=client.db(dbName);
      const collection=db.collection('myCollection'); // Replace with your collection name
      const {cards}=req.body;
      await collection.insertMany([{cards}]); // Assuming body is an array of cards
      res.status(201).json({message: 'Cards saved successfully'});
    } catch(error) {
      console.error('Error saving cards:',error);
      res.status(500).json({message: 'Server error'});
    }
  } else {
    res.status(405).json({message: 'Method Not Allowed'});
  }
}