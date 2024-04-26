import {MongoClient, ObjectId} from 'mongodb'
import clientPromise from '@/utils/mongo'

export default async function handler(req, res) {
  const client=await clientPromise
  const collection=client.db('cardPriceApp').collection('myCollection')
  try {
    const {cardIds}=req.body // Expects an array of card _id values to delete
    const deletionResult=await collection.deleteMany({
      _id: {$in: cardIds.map((id) => new ObjectId(id))}, // Use new with ObjectId
    })
    res.status(200).json(deletionResult)
  } catch(error) {
    console.error('Error deleting cards:', error)
    res.status(500).json({message: 'Server error'})
  }
}