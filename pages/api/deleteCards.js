import {ObjectId} from 'mongodb'
import clientPromise from '../../utils/mongo'

export default async function handler(req, res) {
  if(req.method==='DELETE') {
    try {
      const {cardIds}=req.body

      // Convert cardIds to ObjectId
      const objectIds=cardIds.map((id) => new ObjectId(id))

      const client=await clientPromise
      const collection=client.db('cardPriceApp').collection('myCollection')

      // Delete documents with matching _id
      const result=await collection.deleteOne({_id: {$in: objectIds}})

      res.status(200).json({message: `${ result.deletedCount } document(s) deleted`})
    } catch(error) {
      console.error('Error deleting documents:', error)
      res.status(500).json({message: 'Server error'})
    }
  } else {
    res.status(405).json({message: 'Method Not Allowed'})
  }
}
