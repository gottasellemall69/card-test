// @/pages/api/Yugioh/setNameIdMap.js
import { getSetNameIdMap } from '@/utils/api';

export default async function handler(req, res) {
  const setNameIdMap = await getSetNameIdMap();
  if (!setNameIdMap) {
    res.status(500).json({ message: "Error fetching set name ID map" });
  } else {
    res.status(200).json(setNameIdMap);
  }
}
