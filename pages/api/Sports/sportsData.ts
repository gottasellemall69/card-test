import { NextApiRequest, NextApiResponse } from 'next';
import { chromium } from 'playwright';
import clientPromise from '@/utils/mongo';
import { getSportsUrls } from '@/utils/sportsUrls';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';
const DEFAULT_HEADERS = {
  accept: 'application/json, text/plain, */*',
  'accept-language': 'en-US,en;q=0.9',
  referer: 'https://www.sportscardspro.com/',
};
const REQUEST_TIMEOUT_MS = 45000;

const parseJsonSafe = (payload: string) => {
  try {
    return JSON.parse(payload);
  } catch (error) {
    return null;
  }
};

const fetchWithBrowser = async (urls: string[]) => {
  const browser = await chromium.launch({
    headless: true,
    args: [ '--disable-blink-features=AutomationControlled' ],
  });

  const context = await browser.newContext({
    userAgent: USER_AGENT,
    locale: 'en-US',
    extraHTTPHeaders: DEFAULT_HEADERS,
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const page = await context.newPage();
  const results: unknown[] = [];

  for (const url of urls) {
    try {
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: REQUEST_TIMEOUT_MS,
      });

      if (!response) {
        throw new Error('No response received');
      }

      if (!response.ok()) {
        throw new Error(`Status ${response.status()}`);
      }

      const contentType = response.headers()['content-type'] || '';
      let data: unknown = null;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const bodyText = await response.text();
        data = parseJsonSafe(bodyText);
      }

      if (!data) {
        throw new Error('Invalid JSON payload');
      }

      results.push(data);
    } catch (error) {
      console.error(`Error fetching sports data from ${url}:`, error);
    }
  }

  await page.close();
  await context.close();
  await browser.close();

  return results;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', [ 'GET' ]);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('Cache-Control', 'no-store');

  try {
    const { cardSet } = req.query;

    if (!cardSet || typeof cardSet !== 'string') {
      return res.status(400).json({ error: 'Card set is required' });
    }

    const urls = getSportsUrls(cardSet);

    if (!urls || urls.length === 0) {
      return res.status(404).json({ error: `No data found for card set: ${cardSet}` });
    }

    const results = await fetchWithBrowser(urls);
    const validData = results.filter((result) => result !== null);

    const client = await clientPromise;
    const collection = client.db('cardPriceApp').collection('sportsDataCache');
    const fetchedAt = new Date();

    if (validData.length > 0) {
      await collection.updateOne(
        { cardSet },
        {
          $set: {
            cardSet,
            data: validData,
            fetchedAt,
            sourceUrls: urls,
            pageCount: validData.length,
          },
        },
        { upsert: true }
      );

      return res.status(200).json(validData);
    }

    const cached = await collection.findOne({ cardSet });
    if (cached?.data?.length) {
      return res.status(200).json(cached.data);
    }

    return res.status(502).json({ error: 'No valid data found' });
  } catch (error) {
    console.error('Error fetching sports data:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
