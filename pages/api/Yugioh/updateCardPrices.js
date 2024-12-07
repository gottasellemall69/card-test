// pages/api/updatePrices.js
import { MongoClient } from 'mongodb';
import { clientPromise } from '@/utils/mongo';

const updateCardPrices = async () => {
    const db = await clientPromise();
    const cardsCollection = db.collection('myCollection'); // Your collection name

    const cards = await cardsCollection.find({}).toArray(); // Fetch all cards from the collection

    for (const card of cards) {
        try {
            const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(card.productName)}`);
            const data = await response.json();
            const cardData = data.data[0];

            if (cardData) {
                const newPrice = cardData.card_prices[0] ? parseFloat(cardData.card_prices[0].tcgplayer_price) : null;

                // Prepare price trend
                const priceTrend = {
                    date: new Date(),
                    price: newPrice,
                };

                // Update the card's market price and price history
                await cardsCollection.updateOne(
                    { _id: card._id },
                    {
                        $set: { marketPrice: newPrice }, // Update the current market price
                        $push: { priceHistory: priceTrend }, // Add the new price trend to the history
                    }
                );
            }
        } catch (error) {
            console.error(`Error fetching data for card ${card.productName}:`, error);
        }
    }
};

export default updateCardPrices;