// @/pages/api/Yugioh/setNameIdMap.js
import { getSetNameIdMap } from 'D:/CSVParse/venv/env/card-test/utils/api.js';

export default async function handler(req, res) {
  const setNameIdMap = await getSetNameIdMap();
  if (!setNameIdMap) {
    res.status(500).json({ message: "Error fetching set name ID map" });
  } else {
    res.status(200).json(setNameIdMap);
  }
}
