const fs = require( 'fs' );
const path = require( 'path' );
const readline = require( 'readline' );
const vm = require( 'vm' );
const { MongoClient } = require( 'mongodb' );
const { chromium } = require( 'playwright' );
const ts = require( 'typescript' );

const ROOT_DIR = path.resolve( __dirname, '..' );
const SETS_PATH = path.join( ROOT_DIR, 'constants', 'cardSets.ts' );
const SPORTS_URLS_PATH = path.join( ROOT_DIR, 'utils', 'sportsUrls.ts' );
const DEFAULT_PROFILE_DIR = path.join( ROOT_DIR, '.sports-refresh-browser' );
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

const loadEnvFile = ( filename ) => {
  const envPath = path.join( ROOT_DIR, filename );
  if ( !fs.existsSync( envPath ) ) {
    return;
  }

  const source = fs.readFileSync( envPath, 'utf8' );
  for ( const line of source.split( /\r?\n/ ) ) {
    const match = line.match( /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/ );
    if ( !match ) {
      continue;
    }

    const key = match[ 1 ];
    if ( process.env[ key ] !== undefined ) {
      continue;
    }

    let value = match[ 2 ].trim();
    const quote = value[ 0 ];
    if ( ( quote === '"' || quote === "'" ) && value.endsWith( quote ) ) {
      value = value.slice( 1, -1 );
    }

    process.env[ key ] = value;
  }
};

loadEnvFile( '.env.local' );
loadEnvFile( '.env' );

const parseBoolean = ( value, fallback ) => {
  if ( value === undefined ) {
    return fallback;
  }

  return [ '1', 'true', 'yes', 'on' ].includes( String( value ).toLowerCase() );
};

const parseInteger = ( value, fallback ) => {
  const parsed = Number( value );
  return Number.isFinite( parsed ) && parsed >= 0 ? parsed : fallback;
};

const REQUEST_DELAY_MS = parseInteger( process.env.SPORTSCARDSPRO_REQUEST_DELAY_MS, 1200 );
const PAGE_TIMEOUT_MS = parseInteger( process.env.SPORTSCARDSPRO_PAGE_TIMEOUT_MS, 60000 );
const FETCH_TIMEOUT_MS = parseInteger( process.env.SPORTSCARDSPRO_FETCH_TIMEOUT_MS, 45000 );
let HEADLESS = parseBoolean( process.env.SPORTSCARDSPRO_HEADLESS, false );
const PROFILE_DIR = path.resolve( process.env.SPORTSCARDSPRO_BROWSER_PROFILE || DEFAULT_PROFILE_DIR );
const BROWSER_CHANNEL = process.env.SPORTSCARDSPRO_BROWSER_CHANNEL || 'chrome';
const BROWSER_USER_AGENT = process.env.SPORTSCARDSPRO_USER_AGENT || USER_AGENT;

const sleep = ( durationMs ) =>
  new Promise( ( resolve ) => setTimeout( resolve, durationMs ) );

const readCardSets = () => {
  const source = fs.readFileSync( SETS_PATH, 'utf8' );
  const matches = source.match( /['"]([^'"]+)['"]/g ) || [];
  return matches
    .map( ( match ) => match.replace( /^['"]|['"]$/g, '' ).trim() )
    .filter( Boolean );
};

const loadSportsUrlFactory = () => {
  const source = fs.readFileSync( SPORTS_URLS_PATH, 'utf8' );
  const transpiled = ts.transpileModule( source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  } ).outputText;

  const exportsObject = {};
  const sandbox = {
    exports: exportsObject,
    module: { exports: exportsObject },
    URL,
  };

  vm.runInNewContext( transpiled, sandbox, { filename: SPORTS_URLS_PATH } );
  const getSportsUrls = sandbox.module.exports.getSportsUrls || sandbox.exports.getSportsUrls;

  if ( typeof getSportsUrls !== 'function' ) {
    throw new Error( `Could not load getSportsUrls from ${ SPORTS_URLS_PATH }` );
  }

  return getSportsUrls;
};

const parseArgs = () => {
  const args = process.argv.slice( 2 );
  const selectedSets = [];
  let dryRun = false;

  for ( let index = 0; index < args.length; index += 1 ) {
    const arg = args[ index ];
    if ( arg === '--set' && args[ index + 1 ] ) {
      selectedSets.push( args[ index + 1 ] );
      index += 1;
      continue;
    }

    if ( arg.startsWith( '--set=' ) ) {
      selectedSets.push( arg.slice( '--set='.length ) );
      continue;
    }

    if ( arg === '--headless' ) {
      HEADLESS = true;
      continue;
    }

    if ( arg === '--headed' ) {
      HEADLESS = false;
      continue;
    }

    if ( arg === '--dry-run' ) {
      dryRun = true;
    }
  }

  return { dryRun, selectedSets };
};

const buildPageUrl = ( dataUrl ) => {
  const parsed = new URL( dataUrl );
  parsed.search = '';
  parsed.hash = '';
  return parsed.toString();
};

const isChallengeText = ( value ) => {
  const normalized = String( value || '' ).toLowerCase();
  return (
    normalized.includes( 'just a moment' ) ||
    normalized.includes( 'cf-mitigated' ) ||
    normalized.includes( '/cdn-cgi/challenge-platform' ) ||
    normalized.includes( 'checking if the site connection is secure' )
  );
};

const isChallengePage = async ( page ) => {
  const title = await page.title().catch( () => '' );
  if ( isChallengeText( title ) ) {
    return true;
  }

  const html = await page.content().catch( () => '' );
  return isChallengeText( html );
};

const waitForUser = async () => {
  if ( !process.stdin.isTTY ) {
    throw new Error(
      'Sportscardspro is showing a browser challenge. Run this script in headed mode from an interactive terminal.'
    );
  }

  const rl = readline.createInterface( {
    input: process.stdin,
    output: process.stdout,
  } );

  await new Promise( ( resolve ) => {
    rl.question( 'Complete the Sportscardspro challenge in the browser, then press Enter here to continue. ', resolve );
  } );
  rl.close();
};

const ensureConsoleAccess = async ( page, pageUrl ) => {
  await page.goto( pageUrl, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT_MS } );
  await page.waitForLoadState( 'networkidle', { timeout: 10000 } ).catch( () => {} );

  for ( let attempt = 0; attempt < 6; attempt += 1 ) {
    if ( !( await isChallengePage( page ) ) ) {
      return;
    }
    await page.waitForTimeout( 5000 );
  }

  if ( HEADLESS ) {
    throw new Error(
      'Sportscardspro is showing a browser challenge. Run once with SPORTSCARDSPRO_HEADLESS=0 to warm the browser profile.'
    );
  }

  await waitForUser();

  if ( await isChallengePage( page ) ) {
    throw new Error( 'Sportscardspro challenge is still active after browser confirmation.' );
  }
};

const launchContext = async () => {
  const options = {
    headless: HEADLESS,
    viewport: { width: 1366, height: 900 },
    userAgent: BROWSER_USER_AGENT,
    locale: 'en-US',
    timezoneId: 'America/Los_Angeles',
  };

  if ( BROWSER_CHANNEL ) {
    options.channel = BROWSER_CHANNEL;
  }

  try {
    return await chromium.launchPersistentContext( PROFILE_DIR, options );
  } catch ( error ) {
    if ( !BROWSER_CHANNEL ) {
      throw error;
    }

    console.warn( `Could not launch browser channel "${ BROWSER_CHANNEL }"; falling back to bundled Chromium.` );
    delete options.channel;
    return chromium.launchPersistentContext( PROFILE_DIR, options );
  }
};

const fetchJsonFromBrowser = async ( page, url ) => {
  const result = await page.evaluate(
    async ( payload ) => {
      const controller = new AbortController();
      const timer = setTimeout( () => controller.abort(), payload.timeoutMs );

      try {
        const response = await fetch( payload.url, {
          credentials: 'include',
          headers: {
            accept: 'application/json, text/javascript, */*; q=0.01',
            'x-requested-with': 'XMLHttpRequest',
          },
          signal: controller.signal,
        } );
        const text = await response.text();

        return {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get( 'content-type' ) || '',
          text,
        };
      } finally {
        clearTimeout( timer );
      }
    },
    { url, timeoutMs: FETCH_TIMEOUT_MS }
  );

  if ( !result.ok ) {
    const reason = isChallengeText( result.text ) ? 'Cloudflare challenge HTML' : result.statusText;
    throw new Error( `Status ${ result.status }${ reason ? ` (${ reason })` : '' }` );
  }

  try {
    return JSON.parse( result.text );
  } catch ( error ) {
    const snippet = result.text.slice( 0, 200 ).replace( /\s+/g, ' ' );
    throw new Error( `Invalid JSON response: ${ snippet }` );
  }
};

const refreshCardSet = async ( page, collection, cardSet, urls ) => {
  const data = [];
  const pageUrl = buildPageUrl( urls[ 0 ] );

  await ensureConsoleAccess( page, pageUrl );

  for ( let index = 0; index < urls.length; index += 1 ) {
    const url = urls[ index ];
    const payload = await fetchJsonFromBrowser( page, url );

    if ( payload ) {
      data.push( payload );
    }

    console.log( `  ${ index + 1 }/${ urls.length } ${ url }` );

    if ( REQUEST_DELAY_MS > 0 && index < urls.length - 1 ) {
      await sleep( REQUEST_DELAY_MS );
    }
  }

  if ( !data.length ) {
    throw new Error( 'No valid JSON payloads returned.' );
  }

  const fetchedAt = new Date();
  await collection.updateOne(
    { cardSet },
    {
      $set: {
        cardSet,
        data,
        fetchedAt,
        sourceUrls: urls,
        pageCount: data.length,
        fetchMode: 'browser-console',
      },
    },
    { upsert: true }
  );

  return data.length;
};

const run = async () => {
  if ( !fs.existsSync( SETS_PATH ) ) {
    throw new Error( `Card set list not found at ${ SETS_PATH }` );
  }

  if ( !fs.existsSync( SPORTS_URLS_PATH ) ) {
    throw new Error( `Sports URL list not found at ${ SPORTS_URLS_PATH }` );
  }

  const { dryRun, selectedSets } = parseArgs();
  const allSets = readCardSets();
  const requestedSets = selectedSets.length
    ? allSets.filter( ( setName ) => selectedSets.includes( setName ) )
    : allSets;

  if ( !requestedSets.length ) {
    throw new Error( selectedSets.length ? `No matching card sets found: ${ selectedSets.join( ', ' ) }` : 'No card sets found.' );
  }

  const getSportsUrls = loadSportsUrlFactory();

  if ( dryRun ) {
    for ( const cardSet of requestedSets ) {
      const urls = getSportsUrls( cardSet );
      console.log( `${ cardSet }: ${ urls.length } URL(s)` );
      if ( urls[ 0 ] ) {
        console.log( `  ${ urls[ 0 ] }` );
      }
    }
    return;
  }

  if ( !process.env.MONGODB_URI ) {
    throw new Error( 'MONGODB_URI is required in .env.local, .env, or the shell environment.' );
  }

  const client = new MongoClient( process.env.MONGODB_URI );
  const context = await launchContext();
  const page = await context.newPage();

  console.log( `Refreshing ${ requestedSets.length } set(s) with browser profile: ${ PROFILE_DIR }` );
  console.log( `Browser mode: ${ HEADLESS ? 'headless' : 'headed' }. Request delay: ${ REQUEST_DELAY_MS }ms.` );

  let successCount = 0;

  try {
    await client.connect();
    const collection = client.db( 'cardPriceApp' ).collection( 'sportsDataCache' );

    for ( const cardSet of requestedSets ) {
      const urls = getSportsUrls( cardSet );
      if ( !urls.length ) {
        console.error( `x ${ cardSet }: no URLs configured.` );
        continue;
      }

      try {
        const pageCount = await refreshCardSet( page, collection, cardSet, urls );
        successCount += 1;
        console.log( `ok ${ cardSet}: stored ${ pageCount } page(s).` );
      } catch ( error ) {
        console.error( `x ${ cardSet }: ${ error.message || error }` );
      }
    }
  } finally {
    await context.close().catch( () => {} );
    await client.close().catch( () => {} );
  }

  console.log( `Done. ${ successCount }/${ requestedSets.length } sets refreshed.` );

  if ( successCount === 0 ) {
    process.exitCode = 1;
  }
};

run().catch( ( error ) => {
  console.error( error.message || error );
  process.exit( 1 );
} );
