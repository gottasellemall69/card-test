// pages/api/updateCard.js
import {MongoClient} from 'mongodb'

const uri=process.env.MONGODB_URI
const dbName="cardPriceApp"
const collectionName="myCollection"

// Create a new MongoClient instance, ideally outside the request handler if reused
const client=new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

async function connectToDatabase() {
  // Ensure the client is connected before reusing
  if(!client.isConnected()) await client.connect()
  return client.db(dbName).collection(collectionName)
}

export default async function handler(req, res) {
  if(req.method==='PATCH') {
    try {
      const collection=await connectToDatabase()
      const {filter, update}=req.body
      const updateOptions={returnOriginal: false}

      // Perform the update operation
      const updateResult=await collection.findOneAndUpdate(filter, {$set: update}, updateOptions)

      if(!updateResult.value) {
        return res.status(404).json({message: 'Document not found or no change made.'})
      }

      res.status(200).json(updateResult.value)
    } catch(err) {
      console.error(`Update error: ${ err }`) // More specific error message
      res.status(500).json({message: `Internal server error: ${ err.message }`})
    } finally {
      await client.close() // Close the connection once done
    }
  } else {
    res.setHeader('Allow', ['PATCH'])
    res.status(405).end(`Method ${ req.method } Not Allowed`)
  }
}
