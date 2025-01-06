// /pages/api/updateCardPrices.js
import updateCardPricesLogic from '@/utils/updateCardPricesLogic'; // Move core logic to a separate file for reusability

export default async function handler(req, res) {
  try {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await updateCardPricesLogic(authorizationHeader);
    res.status(200).json({ message: "Prices updated successfully", result });
  } catch (error) {
    console.error("Error updating card prices:", error);
    res.status(500).json({ error: error.message });
  }
}