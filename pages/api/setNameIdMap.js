// pages/api/setNameIdMap.js
import {setNameIdMap} from '@/utils/api';

export default function handler(req,res) {
  res.status(200).json(setNameIdMap);
}
