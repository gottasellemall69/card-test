import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/utils/mongo';
import { getSportsUrls } from '@/utils/sportsUrls';

type HeaderMap = Record<string, string>;
type CookieEntry = {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: string;
};

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';
const DEFAULT_USER_AGENT = process.env.SPORTSCARDSPRO_USER_AGENT || USER_AGENT;
const DEFAULT_HEADERS: HeaderMap = {
  accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'accept-language': 'en-US,en;q=0.9',
  'cache-control': 'no-cache',
  pragma: 'no-cache',
  priority: 'u=0, i',
  referer: 'https://www.sportscardspro.com/console/',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'sec-gpc': '1',
  'upgrade-insecure-requests': '1',
  'user-agent': DEFAULT_USER_AGENT,
};
const REQUEST_TIMEOUT_MS = 450;
const REQUEST_DELAY_MS = 100;
const RETRY_BASE_DELAY_MS = 100;
const MAX_RETRIES = 1;
const RETRY_STATUS_CODES = new Set( [ 429, 503 ] );
const ALLOWED_HEADER_KEYS = new Set( [
  'accept',
  'accept-language',
  'cache-control',
  'cookie',
  'pragma',
  'priority',
  'referer',
  'sec-ch-ua',
  'sec-ch-ua-arch',
  'sec-ch-ua-bitness',
  'sec-ch-ua-full-version',
  'sec-ch-ua-full-version-list',
  'sec-ch-ua-mobile',
  'sec-ch-ua-model',
  'sec-ch-ua-platform',
  'sec-ch-ua-platform-version',
  'sec-fetch-dest',
  'sec-fetch-mode',
  'sec-fetch-site',
  'sec-fetch-user',
  'sec-gpc',
  'upgrade-insecure-requests',
  'user-agent',
] );

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

const sleep = ( durationMs: number ) =>
  new Promise( ( resolve ) => setTimeout( resolve, durationMs ) );

const parseRetryAfterMs = ( headerValue: string | null ) => {
  if ( !headerValue ) {
    return 0;
  }

  const numericSeconds = Number( headerValue );
  if ( Number.isFinite( numericSeconds ) && numericSeconds > 0 ) {
    return numericSeconds * 1000;
  }

  const parsedDate = Date.parse( headerValue );
  if ( Number.isNaN( parsedDate ) ) {
    return 0;
  }

  const delta = parsedDate - Date.now();
  return delta > 0 ? delta : 0;
};

const computeBackoffDelay = ( attempt: number ) => {
  const jitter = Math.floor( Math.random() * 250 );
  return RETRY_BASE_DELAY_MS * Math.pow( 2, attempt ) + jitter;
};

const normalizeCookiePart = ( value: unknown ) => {
  if ( typeof value !== 'string' ) {
    return '';
  }
  return value.trim();
};

const looksLikeCookieTable = ( value: string ) => value.includes( '\t' );

const parseCookieTable = ( value: string ): CookieEntry[] => {
  const lines = value
    .split( /\r?\n/ )
    .map( ( line ) => line.trim() )
    .filter( Boolean );

  const entries: CookieEntry[] = [];

  for ( const line of lines ) {
    if ( line.toLowerCase().startsWith( 'name\tvalue\t' ) ) {
      continue;
    }

    const columns = line.split( '\t' );
    if ( columns.length < 2 ) {
      continue;
    }

    const name = normalizeCookiePart( columns[ 0 ] );
    const cookieValue = normalizeCookiePart( columns[ 1 ] );
    if ( !name || !cookieValue ) {
      continue;
    }

    entries.push( {
      name,
      value: cookieValue,
      domain: normalizeCookiePart( columns[ 2 ] ),
      path: normalizeCookiePart( columns[ 3 ] ),
      expires: normalizeCookiePart( columns[ 4 ] ),
    } );
  }

  return entries;
};

const parseCookieEntries = ( value: unknown ): CookieEntry[] => {
  if ( typeof value === 'string' ) {
    const trimmed = value.trim();
    if ( !trimmed ) {
      return [];
    }
    if ( looksLikeCookieTable( trimmed ) ) {
      return parseCookieTable( trimmed );
    }
    return [];
  }

  if ( Array.isArray( value ) ) {
    return value
      .map( ( entry ) => {
        if ( typeof entry === 'string' ) {
          const pair = entry.trim();
          if ( !pair || !pair.includes( '=' ) ) {
            return null;
          }
          const [ name, ...rest ] = pair.split( '=' );
          const cookieValue = rest.join( '=' );
          if ( !name || !cookieValue ) {
            return null;
          }
          return { name: name.trim(), value: cookieValue.trim() };
        }

        if ( entry && typeof entry === 'object' ) {
          const name = normalizeCookiePart( ( entry as CookieEntry ).name );
          const cookieValue = normalizeCookiePart( ( entry as CookieEntry ).value );
          if ( !name || !cookieValue ) {
            return null;
          }
          return {
            name,
            value: cookieValue,
            domain: normalizeCookiePart( ( entry as CookieEntry ).domain ),
            path: normalizeCookiePart( ( entry as CookieEntry ).path ),
            expires: normalizeCookiePart( ( entry as CookieEntry ).expires ),
          };
        }

        return null;
      } )
      .filter( Boolean ) as CookieEntry[];
  }

  if ( value && typeof value === 'object' ) {
    if ( 'name' in value && 'value' in value ) {
      const name = normalizeCookiePart( ( value as CookieEntry ).name );
      const cookieValue = normalizeCookiePart( ( value as CookieEntry ).value );
      if ( name && cookieValue ) {
        return [
          {
            name,
            value: cookieValue,
            domain: normalizeCookiePart( ( value as CookieEntry ).domain ),
            path: normalizeCookiePart( ( value as CookieEntry ).path ),
            expires: normalizeCookiePart( ( value as CookieEntry ).expires ),
          },
        ];
      }
    }

    return Object.entries( value as Record<string, unknown> )
      .map( ( [ key, rawValue ] ) => {
        const name = normalizeCookiePart( key );
        const cookieValue = normalizeCookiePart( rawValue );
        if ( !name || !cookieValue ) {
          return null;
        }
        return { name, value: cookieValue };
      } )
      .filter( Boolean ) as CookieEntry[];
  }

  return [];
};

const isAllowedCookieDomain = ( domain?: string ) => {
  if ( !domain ) {
    return true;
  }
  const normalized = domain.toLowerCase();
  return normalized === 'sportscardspro.com' || normalized.endsWith( '.sportscardspro.com' );
};

const getPathSpecificity = ( path?: string ) => {
  if ( !path ) {
    return 0;
  }
  const normalized = path.trim();
  const bonus = normalized.startsWith( '/console' ) ? 1000 : 0;
  return normalized.length + bonus;
};

const getDomainSpecificity = ( domain?: string ) => {
  if ( !domain ) {
    return 0;
  }
  return domain.trim().length;
};

const isExpiredCookie = ( expires?: string ) => {
  if ( !expires ) {
    return false;
  }
  const timestamp = Date.parse( expires );
  if ( Number.isNaN( timestamp ) ) {
    return false;
  }
  return timestamp <= Date.now();
};

const dedupeCookieEntries = ( entries: CookieEntry[] ) => {
  const map = new Map<string, CookieEntry>();

  for ( const entry of entries ) {
    if ( !entry?.name || !entry.value ) {
      continue;
    }

    if ( entry.domain && !isAllowedCookieDomain( entry.domain ) ) {
      continue;
    }

    if ( isExpiredCookie( entry.expires ) ) {
      continue;
    }

    const existing = map.get( entry.name );
    if ( !existing ) {
      map.set( entry.name, entry );
      continue;
    }

    const existingScore =
      getPathSpecificity( existing.path ) + getDomainSpecificity( existing.domain );
    const candidateScore =
      getPathSpecificity( entry.path ) + getDomainSpecificity( entry.domain );

    if ( candidateScore > existingScore ) {
      map.set( entry.name, entry );
    }
  }

  return Array.from( map.values() );
};

const buildCookieHeaderFromEntries = ( entries: CookieEntry[] ) => {
  const normalized = dedupeCookieEntries( entries );
  return normalized
    .map( ( entry ) => `${ entry.name }=${ entry.value }` )
    .filter( Boolean )
    .join( '; ' );
};

const coerceCookieHeader = ( value: unknown ) => {
  if ( typeof value === 'string' ) {
    const trimmed = value.trim();
    if ( !trimmed ) {
      return '';
    }

    const withoutPrefix = trimmed.replace( /^cookie\s*:\s*/i, '' );
    if ( looksLikeCookieTable( withoutPrefix ) ) {
      return buildCookieHeaderFromEntries( parseCookieTable( withoutPrefix ) );
    }

    return withoutPrefix;
  }

  const entries = parseCookieEntries( value );
  if ( entries.length === 0 ) {
    return '';
  }

  return buildCookieHeaderFromEntries( entries );
};

const normalizeHeaderValue = ( value: unknown ) => {
  if ( Array.isArray( value ) ) {
    const normalized = value
      .map( ( entry ) => ( typeof entry === 'string' ? entry.trim() : '' ) )
      .filter( Boolean )
      .join( ', ' );
    return normalized.length > 0 ? normalized : '';
  }

  if ( typeof value !== 'string' ) {
    return '';
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : '';
};

const pickForwardedHeaders = (
  value: unknown,
  options: { allowCookie?: boolean; } = {}
): HeaderMap => {
  const allowCookie = options.allowCookie ?? true;

  if ( !value || typeof value !== 'object' ) {
    return {};
  }

  return Object.entries( value as Record<string, unknown> ).reduce<HeaderMap>(
    ( acc, [ key, rawValue ] ) => {
      const normalizedKey = key.toLowerCase();
      if ( !ALLOWED_HEADER_KEYS.has( normalizedKey ) ) {
        return acc;
      }

      if ( !allowCookie && normalizedKey === 'cookie' ) {
        return acc;
      }

      const normalizedValue = normalizeHeaderValue( rawValue );
      if ( normalizedValue ) {
        acc[ normalizedKey ] = normalizedValue;
      }

      return acc;
    },
    {}
  );
};

const resolveCookie = ( cookieOverride: unknown, extraHeaders: HeaderMap ) => {
  const overrideCookie = coerceCookieHeader( cookieOverride );
  if ( overrideCookie ) {
    return overrideCookie;
  }

  const headerCookie = coerceCookieHeader( extraHeaders.cookie );
  if ( headerCookie ) {
    return headerCookie;
  }

  const envCookie = coerceCookieHeader( process.env.SPORTSCARDSPRO_COOKIE );
  if ( envCookie ) {
    return envCookie;
  }

  return '';
};

const buildRequestHeaders = (
  baseHeaders: HeaderMap,
  extraHeaders: HeaderMap,
  cookieOverride?: unknown
): HeaderMap => {
  const headers: HeaderMap = { ...DEFAULT_HEADERS, ...baseHeaders, ...extraHeaders };
  const cookie = resolveCookie( cookieOverride, extraHeaders );
  if ( cookie ) {
    headers.cookie = cookie;
  }

  return headers;
};

const fetchWithTimeout = async ( url: string, headers: HeaderMap = DEFAULT_HEADERS ) => {
  const controller = new AbortController();
  const timer = setTimeout( () => controller.abort(), REQUEST_TIMEOUT_MS );

  try {
    return await fetch( url, {
      headers,
      signal: controller.signal,
    } );
  } finally {
    clearTimeout( timer );
  }
};

const buildRefererForUrl = ( url: string ) => {
  try {
    const parsed = new URL( url );
    return `${ parsed.origin }${ parsed.pathname }`;
  } catch ( error ) {
    return DEFAULT_HEADERS.referer || 'https://www.sportscardspro.com/';
  }
};

const applyRequestOverrides = ( url: string, headers: HeaderMap ): HeaderMap => {
  const nextHeaders: HeaderMap = { ...headers };
  nextHeaders.referer = buildRefererForUrl( url );
  nextHeaders[ 'sec-fetch-site' ] = 'none';
  nextHeaders[ 'sec-fetch-mode' ] = 'navigate';
  nextHeaders[ 'sec-fetch-dest' ] = 'document';
  nextHeaders[ 'sec-fetch-user' ] = '?1';
  return nextHeaders;
};

const fetchWithRetry = async ( url: string, headers: HeaderMap = DEFAULT_HEADERS ) => {
  const retries = Math.max( 0, MAX_RETRIES );

  for ( let attempt = 0; attempt <= retries; attempt += 1 ) {
    try {
      const response = await fetchWithTimeout( url, applyRequestOverrides( url, headers ) );

      if ( response.ok ) {
        return response;
      }

      if ( RETRY_STATUS_CODES.has( response.status ) && attempt < retries ) {
        const retryAfter = parseRetryAfterMs( response.headers.get( 'retry-after' ) );
        const delayMs = retryAfter || computeBackoffDelay( attempt );
        if ( delayMs > 0 ) {
          await sleep( delayMs );
        }
        continue;
      }

      throw new Error( `Status ${ response.status }` );
    } catch ( error ) {
      if ( attempt < retries ) {
        const delayMs = computeBackoffDelay( attempt );
        if ( delayMs > 0 ) {
          await sleep( delayMs );
        }
        continue;
      }

      throw error;
    }
  }

  throw new Error( 'Request failed after retries' );
};

const fetchFromServer = async ( urls: string[], headers: HeaderMap = DEFAULT_HEADERS ) => {
  const results: unknown[] = [];

  for ( let index = 0; index < urls.length; index += 1 ) {
    const url = urls[ index ];
    try {
      const response = await fetchWithRetry( url, headers );

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

    if ( REQUEST_DELAY_MS > 0 && index < urls.length - 1 ) {
      await sleep( REQUEST_DELAY_MS );
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

    const cached = await collection.findOne( { cardSet } );
    const cachedData = cached?.data?.length ? cached.data : null;

    if ( method === 'GET' && cachedData ) {
      return res.status( 200 ).json( cachedData );
    }

    const baseHeaders = pickForwardedHeaders( req.headers, { allowCookie: false } );
    const extraHeaders = pickForwardedHeaders( req.body?.headers );
    const cookieOverride =
      req.body?.cookie ??
      req.body?.cookieJar ??
      req.body?.cookieText ??
      req.body?.cookies;
    const requestHeaders = buildRequestHeaders( baseHeaders, extraHeaders, cookieOverride );

    if ( !requestHeaders.cookie && cachedData ) {
      return res.status( 200 ).json( cachedData );
    }

    if ( !requestHeaders.cookie ) {
      return res.status( 400 ).json( {
        error: 'SPORTSCARDSPRO_COOKIE is required to fetch fresh data.',
      } );
    }

    const serverData = await fetchFromServer( urls, requestHeaders );
    const dataToStore = serverData.filter( Boolean );

    if ( dataToStore.length === 0 ) {
      if ( cachedData ) {
        return res.status( 200 ).json( cachedData );
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
