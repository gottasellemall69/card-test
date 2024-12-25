import { NextApiRequest, NextApiResponse } from 'next';
import { getSportsUrls } from 'D:/CSVParse/venv/env/card-test/utils/sportsUrls';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { cardSet } = req.query;
    
    if (!cardSet || typeof cardSet !== 'string') {
      return res.status(400).json({ error: 'Card set is required' });
    }

    const urls = getSportsUrls(cardSet);
    
    if (!urls || urls.length === 0) {
      return res.status(404).json({ error: `No data found for card set: ${cardSet}` });
    }

    const dataPromises = urls.map(async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch from ${url}`);
        }
        return response.json();
      } catch (error) {
        console.error(`Error fetching from ${url}:`, error);
        return null;
      }
    });

    const results = await Promise.all(dataPromises);
    const validData = results.filter(result => result !== null);

    if (validData.length === 0) {
      return res.status(404).json({ error: 'No valid data found' });
    }

    res.status(200).json(validData);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}