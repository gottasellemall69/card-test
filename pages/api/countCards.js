import {MongoClient} from 'mongodb'

const uri=process.env.MONGODB_URI
const client=new MongoClient(uri)

export default async function handler(req, res) {
  if(req.method==='GET') {
    try {
      await client.connect()
      const database=client.db('cardPriceApp')
      const cards=database.collection('myCollection')

      // Get the total number of cards
      const count=await cards.estimatedDocumentCount()

      res.status(200).json({count})
    } catch(error) {
      console.error(error)
      res.status(500).json({error: 'Unable to fetch card count'})
    } finally {
      await client.close()
    }
  } else {
    res.status(405).json({error: 'Method not allowed'})
  }
}
