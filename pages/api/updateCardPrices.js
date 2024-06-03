import clientPromise from '@/utils/mongo' // Adjust the path as necessary

export default async function handler(req, res) {
  if(req.method==='POST') {
    const {setName, cardData}=req.body

    if(!setName||!Array.isArray(cardData)) {
      return res.status(400).json({error: 'Invalid data'})
    }

    try {
      const {db}=await clientPromise
      const collection=db.collection('myCollection')

      // Update the prices for each card in the set
      await Promise.all(cardData.map(async (card) => {
        await collection.updateOne(
          {setName, number: card.number},
          {$set: {marketPrice: card.marketPrice}}
        )
      }))

      res.status(200).json({message: 'Prices updated successfully'})
    } catch(error) {
      console.error('Error updating prices:', error)
      res.status(500).json({error: 'Internal server error'})
    }
  } else {
    res.status(405).json({error: 'Method not allowed'})
  }
}
