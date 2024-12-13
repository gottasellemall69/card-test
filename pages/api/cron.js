// cron.js
import updateCardPrices from '@/pages/api/Yugioh/updateCardPrices';

export default async function handler(req, res) {
    await updateCardPrices();
    res.status(200).end('Running the price update job...');
};