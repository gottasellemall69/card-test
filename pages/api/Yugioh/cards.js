// pages\api\Yugioh\cards.js
import jwt from "jsonwebtoken";
import clientPromise from '@/utils/mongo.js';

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db('cardPriceApp');
    const collection = db.collection('myCollection');

    if (req.method === 'POST') {
      const authorizationHeader = req.headers.authorization;

      if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Extract and verify token
      const token = authorizationHeader.split(" ")[1];
      let decodedToken;

      try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        console.error("Invalid token:", error);
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
      }

      const userId = decodedToken.username;
      const { cards } = req.body;

      if (!cards || cards.length === 0) {
        return res.status(400).json({ error: "No cards provided." });
      }

      const bulkOps = cards.map((card) => ({
        updateOne: {
          filter: {
            userId,
            productName: card.productName,
            setName: card.setName,
            number: card.number,
            printing: card.printing,
            rarity: card.rarity,
            condition: card.condition,
          },
          update: {
            $inc: { quantity: card.quantity || 1 },
            $set: { oldPrice: null },
            $setOnInsert: {
              marketPrice: card.marketPrice || 0,
              userId
            },
          },
          upsert: true,
        },
      }));

      await collection.bulkWrite(bulkOps);

      res.status(201).json({ message: 'Cards saved/updated successfully' });
    } else {
      res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Error saving/updating cards:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
