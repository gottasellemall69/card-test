import jwt from "jsonwebtoken";
import clientPromise from "@/utils/mongo";

export default async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    const client = await clientPromise;
    const db = client.db("cardPriceApp");
    const user = await db.collection("users").findOne({ _id: decoded.userId });

    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ error: "Unauthorized" });
  }
}
