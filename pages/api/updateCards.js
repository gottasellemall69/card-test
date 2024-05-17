import {MongoClient, ObjectId} from 'mongodb'

export default async function updateCardsHandler(req, res) {
  const client=new MongoClient(process.env.MONGODB_URI)

  try {
    await client.connect()

    if(req.method==='PATCH') {
      const {cardId, field, value}=req.body

      if(!cardId||!field||!value) {
        return res.status(400).json({message: 'Missing cardId, field, or value in request body'})
      }

      const collection=client.db('cardPriceApp').collection('myCollection')

      const updatedCard=await collection.findOneAndUpdate(
        {_id: new ObjectId(cardId)},
        {$set: {[field]: value}},
        {returnDocument: 'after'},
        {returnOriginal: false}
      )

      if(!updatedCard) {
        return res.status(404).json({message: 'Card not found'})
      }

      res.status(200).json(updatedCard)
    } else {
      res.setHeader('Allow', ['PATCH'])
      res.status(405).end(`Method ${ req.method } Not Allowed`)
    }
  } catch(error) {
    console.error('Update error:', error)
    res.status(500).json({message: `Internal server error: ${ error.message }`})
  } finally {
    await client.close()
  }
}
