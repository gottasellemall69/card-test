// /pages/api/updatePrices.js
import { MongoClient } from 'mongodb';

export default async function updateCardPrices(req, res) {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db('cardPriceApp');
    const cardsCollection = db.collection('myCollection');

    // Fetch all cards
    const cards = await cardsCollection.find({}).toArray();

    for (const card of cards) {
      try {
        // Fetch updated card price
        const response = await fetch(
          `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(card.productName)}&tcgplayer_data=true`
        );
        const data = await response.json();
        const cardData = data.data?.[0];

        if (cardData) {
          // Match the specific set details (e.g., set_code or set_name)
          const matchingSet = cardData.card_sets?.find(
            (set) =>
              set.set_code === card.number ||
              (set.set_name === card.setName && set.set_rarity === card.rarity)
          );

          if (matchingSet) {
            const newPrice = matchingSet.set_price ? parseFloat(matchingSet.set_price) : null;

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
          } else {
            console.warn(`No matching set found for card: ${card.productName}`);
          }
        } else {
          console.warn(`Card data not found for: ${card.productName}`);
        }
      } catch (error) {
        console.error(`Error updating card ${card.productName}:`, error);
      }
    }

    // Respond to the client
    res.status(200).json({ message: 'Card prices updated successfully.' });
  } catch (error) {
    console.error('Error in updateCardPrices:', error);
    res.status(500).json({ error: 'An error occurred while updating card prices.' });
  } finally {
    await client.close();
  }
}
