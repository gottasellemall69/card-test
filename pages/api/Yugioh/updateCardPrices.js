// pages/api/updatePrices.js
import { MongoClient } from 'mongodb';


const updateCardPrices = async () => {
    const client=new MongoClient(process.env.MONGODB_URI)
    await client.connect()
    const db=client.db('cardPriceApp')
    const cards=db.collection('myCollection')

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