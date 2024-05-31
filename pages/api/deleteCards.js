import {MongoClient, ObjectId} from 'mongodb'

export default async function handler(req, res) {
  if(req.method==='DELETE') {
    const client=new MongoClient(process.env.MONGODB_URI)
    await client.connect()
    const db=client.db('cardPriceApp')
    const collection=db.collection('myCollection')
    const {cardId}=req.body

    try {
      const result=await collection.deleteOne({_id: new ObjectId(cardId)})

      if(result.deletedCount===1) {
        res.status(200).json({message: 'Card deleted successfully'})
      } else {
        res.status(404).json({message: 'Card not found'})
      }
    } catch(error) {
      console.error('Delete error:', error)
      res.status(500).json({message: `Internal server error: ${ error.message }`})
    } finally {
      await client.close()
    }
  } else {
    res.setHeader('Allow', ['DELETE'])
    res.status(405).json({message: `Method ${ req.method } Not Allowed`})
  }
}
