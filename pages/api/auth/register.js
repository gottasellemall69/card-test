import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const client=new MongoClient(process.env.MONGODB_URI)
    const db = client.db("cardPriceApp");

    // Check if the user already exists
    const existingUser = await db.collection("users").findOne({ username, userId });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    await db.collection("users").insertOne({
      username,
      password: hashedPassword,
      createdAt: new Date(),
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
