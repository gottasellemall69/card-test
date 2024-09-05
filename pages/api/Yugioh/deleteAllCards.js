import {MongoClient} from 'mongodb'

export default async function handler(req, res) {
  if(req.method==='DELETE') {
    const client=new MongoClient(process.env.MONGODB_URI)
    await client.connect()
    const db=client.db('cardPriceApp')
    const collection=db.collection('myCollection')

    try {
      const result=await collection.deleteMany({})

      if(result.deletedCount>0) {
        res.status(200).json({message: 'All cards deleted successfully'})
      } else {
        res.status(404).json({message: 'No cards found to delete'})
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
