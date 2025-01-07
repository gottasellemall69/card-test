import { MongoClient, ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method === "PATCH") {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    let userId;

    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      userId = decodedToken.username;
    } catch (error) {
      console.error("Invalid token:", error);
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("cardPriceApp");
    const cards = db.collection("myCollection");
    const { cardId, field, value } = req.body;

    try {
      const result = await cards.updateOne(
        { _id: new ObjectId(cardId), userId },
        { $set: { [field]: value } }
      );

      if (result.modifiedCount >= 1) {
        res.status(200).json({ message: "Card updated successfully" });
      } else {
        res.status(404).json({ message: "Card not found or does not belong to the user" });
      }
    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({ message: `Internal server error: ${error.message}` });
    } finally {
      await client.close();
    }
  } else {
    res.setHeader("Allow", ["PATCH"]);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
