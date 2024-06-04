import {MongoClient} from "mongodb"

const uri=process.env.MONGODB_URI
const client=new MongoClient(uri)

const wss=new WebSocket.Server({port: 8080})

async function run() {
  try {
    await client.connect()
    const database=client.db("cardPriceApp")
    const cards=database.collection("myCollection")

    const changeStream=cards.watch()

    changeStream.on("change", (change) => {
      console.log("Received change:\n", change)
      wss.clients.forEach((client) => {
        if(client.readyState===WebSocket.OPEN) {
          client.send(JSON.stringify(change))
        }
      })
    })

    console.log("Listening for changes in the 'myCollection' collection...")
  } catch(error) {
    console.error("Error in change stream handler:", error)
  }
}

run().catch(console.dir)

wss.on("connection", (ws) => {
  console.log("Client connected")
  ws.on("close", () => {
    console.log("Client disconnected")
  })
})
