// @/pages/api/Yugioh/cards/[setNameId].js
import { getCardData, getSetNameIdMap } from '@/utils/api';

export default async function handler(req, res) {
  const { setNameId } = req.query;

  try {
    const setNameIdMap = await getSetNameIdMap();
    const setName = Object.keys(setNameIdMap).find(
      (name) => setNameIdMap[name] === parseInt(setNameId)
    );

    if (!setName) {
      throw new Error("Set name not found for given setNameId");
    }

    const cardData = await getCardData(setName);
    res.status(200).json(cardData);
  } catch (error) {
    console.error("Error fetching card data:", error);
    res.status(500).json({ message: "Error fetching card data" });
  }
}
