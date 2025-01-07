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

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db("cardPriceApp");
    const usersCollection = db.collection("users");

    // Check if the username already exists
    const existingUser = await usersCollection.findOne({ username: { $eq: username } });
    if (existingUser) {
      return res.status(409).json({ message: "Username is already taken." });
    }

    // Get all existing userIds
    const existingUserIds = await usersCollection.distinct("userId");

    // Find the smallest unused userId
    const newUserId = (() => {
      for (let i = 1; ; i++) {
        if (!existingUserIds.includes(i)) return i;
      }
    })();

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user
    const result = await usersCollection.insertOne({
      username,
      password: hashedPassword,
      createdAt: new Date(),
      userId: newUserId,
    });

    if (result.insertedId) {
      res.status(201).json({ message: "User registered successfully." });
    } else {
      throw new Error("Failed to register user.");
    }
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error." });
  } finally {
    await client.close();
  }
}