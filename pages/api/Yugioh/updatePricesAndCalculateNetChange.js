import axios from 'axios';
import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = "cardPriceApp";
const COLLECTION_NAME = "myCollection";

async function updatePricesAndCalculateNetChange() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Fetch all cards in the collection
    const cards = await collection.find().toArray();
    
    let totalNetChange = 0;
    const priceUpdates = [];

    for (const card of cards) {
      const { productName, setNameId, lastPrice } = card;
      
      // Dynamically construct URL to fetch price
      const url = `https://infinite-api.tcgplayer.com/priceguide/set/${setNameId}/cards/`;
      
      // Fetch latest price
      const { data } = await axios.get(url);
      const updatedPrice = data.find(c => c.productName === productName)?.marketPrice || 0;
      
      if (lastPrice != null) {
        // Calculate net gain/loss for this card
        const netChange = updatedPrice - lastPrice;
        totalNetChange += netChange;
        
        // Prepare update for this card
        priceUpdates.push({
          updateOne: {
            filter: { _id: card._id },
            update: { $set: { lastPrice: updatedPrice, netChange } },
          },
        });
      } else {
        // If no previous price, initialize it
        priceUpdates.push({
          updateOne: {
            filter: { _id: card._id },
            update: { $set: { lastPrice: updatedPrice, netChange: 0 } },
          },
        });
      }
    }
    
    // Apply batch updates
    if (priceUpdates.length > 0) {
      await collection.bulkWrite(priceUpdates);
    }
    
    console.log(`Total Net Change: ${totalNetChange > 0 ? '+' : ''}${totalNetChange}`);
    return totalNetChange;

  } catch (error) {
    console.error("Error updating prices:", error);
  } finally {
    await client.close();
  }
}

// Set up a cron job to run this function on a schedule (e.g., daily)
export default updatePricesAndCalculateNetChange;
