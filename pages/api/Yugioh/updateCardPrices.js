// /pages/api/updateCardPrices.js
import updateCardPricesLogic from '@/utils/updateCardPricesLogic'; // Move core logic to a separate file for reusability

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await updateCardPricesLogic();
    res.status(200).json({ message: 'Card prices updated successfully.', result });
  } catch (error) {
    console.error('Error in /api/updateCardPrices:', error);
    res.status(500).json({ error: 'An error occurred while updating card prices.' });
  }
}
