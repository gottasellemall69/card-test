// /pages/api/cron.js
import updateCardPrices from 'D:/CSVParse/venv/env/card-test/pages/api/Yugioh/updateCardPrices.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    await updateCardPrices();
    res.status(200).json({ message: 'Cron job executed successfully' });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
