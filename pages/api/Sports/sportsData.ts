import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/utils/mongo';
import { getSportsUrls } from '@/utils/sportsUrls';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';
const DEFAULT_HEADERS = {
  accept: 'application/json, text/plain, */*',
  'accept-language': 'en-US,en;q=0.9',
  referer: 'https://www.sportscardspro.com/',
  'user-agent': USER_AGENT,
};
const REQUEST_TIMEOUT_MS = 45000;

const normalizeCardSet = ( value: unknown ) => {
  if ( typeof value !== 'string' ) {
    return '';
  }
  return value.trim();
};

const parseJsonSafe = ( payload: string ) => {
  try {
    return JSON.parse( payload );
  } catch ( error ) {
    return null;
  }
};

const fetchWithTimeout = async ( url: string ) => {
  const controller = new AbortController();
  const timer = setTimeout( () => controller.abort(), REQUEST_TIMEOUT_MS );

  try {
    return await fetch( url, {
      headers: DEFAULT_HEADERS,
      signal: controller.signal,
    } );
  } finally {
    clearTimeout( timer );
  }
};

const fetchFromServer = async ( urls: string[] ) => {
  const results: unknown[] = [];

  for ( const url of urls ) {
    try {
      const response = await fetchWithTimeout( url );

      if ( !response.ok ) {
        throw new Error( `Status ${ response.status }` );
      }

      const contentType = response.headers.get( 'content-type' ) || '';
      let data: unknown = null;

      if ( contentType.includes( 'application/json' ) ) {
        data = await response.json();
      } else {
        const bodyText = await response.text();
        data = parseJsonSafe( bodyText );
      }

      if ( !data ) {
        throw new Error( 'Invalid JSON payload' );
      }

      results.push( data );
    } catch ( error ) {
      console.error( `Error fetching sports data from ${ url }:`, error );
    }
  }

  return results;
};

export default async function handler( req: NextApiRequest, res: NextApiResponse ) {
  res.setHeader( 'Cache-Control', 'no-store' );

  const method = req.method ?? 'GET';

  if ( method !== 'GET' && method !== 'POST' ) {
    res.setHeader( 'Allow', [ 'GET', 'POST' ] );
    return res.status( 405 ).json( { error: 'Method Not Allowed' } );
  }

  try {
    const cardSet = normalizeCardSet( method === 'POST'
      ? req.body?.cardSet ?? req.query.cardSet
      : req.query.cardSet );

    if ( !cardSet ) {
      return res.status( 400 ).json( { error: 'Card set is required' } );
    }

    const urls = getSportsUrls( cardSet );
    if ( !urls || urls.length === 0 ) {
      return res.status( 404 ).json( { error: `No data found for card set: ${ cardSet }` } );
    }

    const client = await clientPromise;
    const collection = client.db( 'cardPriceApp' ).collection( 'sportsDataCache' );

    if ( method === 'GET' ) {
      const cached = await collection.findOne( { cardSet } );
      if ( cached?.data?.length ) {
        return res.status( 200 ).json( cached.data );
      }

      return res.status( 404 ).json( { error: 'No cached data found' } );
    }

    const payload = Array.isArray( req.body?.data ) ? req.body.data.filter( Boolean ) : [];
    let dataToStore = payload;

    if ( dataToStore.length === 0 ) {
      const serverData = await fetchFromServer( urls );
      dataToStore = serverData.filter( Boolean );
    }

    if ( dataToStore.length === 0 ) {
      const cached = await collection.findOne( { cardSet } );
      if ( cached?.data?.length ) {
        return res.status( 200 ).json( cached.data );
      }

      return res.status( 502 ).json( { error: 'No valid data found' } );
    }

    const fetchedAt = new Date();
    await collection.updateOne(
      { cardSet },
      {
        $set: {
          cardSet,
          data: dataToStore,
          fetchedAt,
          sourceUrls: urls,
          pageCount: dataToStore.length,
        },
      },
      { upsert: true }
    );

    return res.status( 200 ).json( dataToStore );
  } catch ( error ) {
    console.error( 'Error handling sports data:', error );
    return res.status( 500 ).json( { error: 'Internal Server Error' } );
  }
}
