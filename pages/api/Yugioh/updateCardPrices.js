// /pages/api/updatePrices.js
import { MongoClient } from 'mongodb';

const updateCardPrices = async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('cardPriceApp');
  const cardsCollection = db.collection('myCollection');

  // Fetch all cards
  const cards = await cardsCollection.find({}).toArray();

  for (const card of cards) {
    try {
      // Fetch updated card price
      const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(card.productName)}`);
      const data = await response.json();
      const cardData = data.data?.[0];

      if (cardData) {
        const newPrice = cardData.card_prices?.[0]?.tcgplayer_price ? parseFloat(cardData.card_prices[0].tcgplayer_price) : null;

        // Update the database
        await cardsCollection.updateOne(
          { _id: card._id },
          {
            $set: {
              marketPrice: newPrice,
              oldPrice: card.marketPrice, // Save the old price
            },
            $push: {
              priceHistory: {
                date: new Date(),
                price: newPrice,
              }, // Add to price history
            },
          }
        );
      }
    } catch (error) {
      console.error(`Error updating card ${card.productName}:`, error);
    }
  }

  await client.close();
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    await updateCardPrices();
    res.status(200).json({ message: 'Card prices updated successfully' });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
