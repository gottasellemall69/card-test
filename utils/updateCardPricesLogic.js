// /utils/updateCardPricesLogic.js
import clientPromise from "@/utils/mongo.js";
import jwt from "jsonwebtoken";
import { ensureSafeUserId } from "@/utils/securityValidators.js";
import { recordPriceHistoryEntry } from "@/utils/priceHistoryStore";
import { getSetNameIdMap } from "@/utils/api.js";

const REMOTE_FETCH_DELAY_MS = 1250;
const REMOTE_FETCH_RETRY_LIMIT = 4;
const UPDATE_TIME_BUDGET_MS = 4.5 * 60 * 1000;
const PRICE_UPDATE_JOB_COLLECTION = "yugiohPriceUpdateJobs";
const ACTIVE_PRICE_UPDATE_STATUSES = [ "pending", "running", "partial", "rate_limited" ];
const STALE_RUNNING_JOB_MS = 10 * 60 * 1000;

const RARITY_NORMALIZATION_MAP = {
  "Common": "Common",
  "Common / Short Print": "Common",
  "Rare": "Rare",
  "Super Rare": "Super Rare",
  "Ultra Rare": "Ultra Rare",
  "Secret Rare": "Secret Rare",
  "Ultimate Rare": "Ultimate Rare",
  "Prismatic Secret Rare": "Prismatic Secret Rare",
  "Starfoil Rare": "Starfoil Rare",
  "Mosaic Rare": "Mosaic Rare",
  "Shatterfoil Rare": "Shatterfoil Rare",
  "Collector's Rare": "Collector's Rare",
  "Starlight Rare": "Starlight Rare",
  "Ghost Rare": "Ghost Rare",
  "Gold Rare": "Gold Rare",
  "Gold Secret Rare": "Gold Secret Rare",
  "Premium Gold Rare": "Premium Gold Rare",
  "Quarter Century Secret Rare": "Quarter Century Secret Rare",
  "Prismatic Ultimate Rare": "Prismatic Ultimate Rare",
  "Duel Terminal Technology Common": "Duel Terminal Technology Common",
  "Duel Terminal Technology Ultra Rare": "Duel Terminal Technology Ultra Rare"
};

function normalizeRarity( rarity ) {
  if ( !rarity ) {
    return "";
  }

  const normalized = RARITY_NORMALIZATION_MAP[ rarity ];
  if ( !normalized ) {
    console.warn( `Unmapped rarity: ${ rarity }` );
  }
  return normalized || rarity;
}

const normalizeWhitespace = ( value ) =>
  ( value ?? "" ).toString().replace( /\s+/g, " " ).trim();

const normalizeText = ( value ) => normalizeWhitespace( value ).toLowerCase();

const normalizeCompact = ( value ) =>
  normalizeText( value ).replace( /[^a-z0-9]+/g, "" );

const normalizeLooseText = ( value ) =>
  normalizeText( value ).replace( /[^a-z0-9]+/g, " " ).trim();

const textMatches = ( left, right ) => {
  const leftText = normalizeLooseText( left );
  const rightText = normalizeLooseText( right );

  if ( !leftText || !rightText ) {
    return false;
  }

  return leftText === rightText || leftText.includes( rightText ) || rightText.includes( leftText );
};

const normalizeEditionKey = ( value ) => {
  const normalized = normalizeLooseText( value );

  if ( !normalized || normalized === "unknown edition" ) {
    return "";
  }

  if ( /\bunlimited\b/.test( normalized ) ) {
    return "unlimited";
  }

  if ( /\b1st\b|\bfirst\b/.test( normalized ) ) {
    return "1st";
  }

  if ( /\blimited\b/.test( normalized ) ) {
    return "limited";
  }

  return normalized.replace( /\bedition\b/g, "" ).replace( /\s+/g, " " ).trim();
};

const normalizeConditionKey = ( value ) =>
  normalizeLooseText( value )
    .replace( /\b(?:1st|first|limited|unlimited)\s+edition\b/g, "" )
    .replace( /\b(?:1st|first|limited|unlimited)\b/g, "" )
    .replace( /\bedition\b/g, "" )
    .replace( /\s+/g, " " )
    .trim();

const normalizeRarityKey = ( value ) => normalizeCompact( normalizeRarity( normalizeWhitespace( value ) ) );

const parsePrice = ( value ) => {
  const numeric = Number.parseFloat( ( value ?? "" ).toString().replace( /[^0-9.-]+/g, "" ) );
  return Number.isFinite( numeric ) ? numeric : null;
};

const extractCardRows = ( payload ) => {
  if ( Array.isArray( payload ) ) {
    return payload;
  }

  if ( Array.isArray( payload?.result ) ) {
    return payload.result;
  }

  return [];
};

const slimPriceRows = ( rows ) =>
  ( Array.isArray( rows ) ? rows : [] ).map( ( row ) => ( {
    productName: row?.productName ?? "",
    set: row?.set ?? row?.setName ?? "",
    number: row?.number ?? "",
    printing: row?.printing ?? "",
    rarity: row?.rarity ?? "",
    condition: row?.condition ?? "",
    marketPrice: row?.marketPrice ?? "0.00",
    lowPrice: row?.lowPrice ?? "0.00",
  } ) );

const sleep = ( ms ) => new Promise( ( resolve ) => setTimeout( resolve, ms ) );

const getRetryDelay = ( response ) => {
  const retryAfter = response?.headers?.get?.( "retry-after" );
  const retrySeconds = Number.parseFloat( retryAfter );

  if ( Number.isFinite( retrySeconds ) && retrySeconds > 0 ) {
    return Math.min( retrySeconds * 1000, 15000 );
  }

  return 10000;
};

const createDeadline = () => Date.now() + UPDATE_TIME_BUDGET_MS;

const hasTimeForRemoteFetch = ( deadline ) => Date.now() + 15000 < deadline;

const editionsMatch = ( left, right ) => {
  const leftKey = normalizeEditionKey( left );
  const rightKey = normalizeEditionKey( right );

  if ( !leftKey || !rightKey ) {
    return true;
  }

  return leftKey === rightKey;
};

const raritiesMatch = ( left, right ) => {
  const leftKey = normalizeRarityKey( left );
  const rightKey = normalizeRarityKey( right );

  if ( !leftKey || !rightKey ) {
    return true;
  }

  return leftKey === rightKey || leftKey.includes( rightKey ) || rightKey.includes( leftKey );
};

const conditionsMatch = ( left, right ) => {
  const leftKey = normalizeConditionKey( left );
  const rightKey = normalizeConditionKey( right );

  if ( !leftKey || !rightKey ) {
    return true;
  }

  return leftKey === rightKey || leftKey.includes( rightKey ) || rightKey.includes( leftKey );
};

const scoreCandidate = ( row, card ) => {
  const rowPrice = parsePrice( row?.marketPrice );
  if ( rowPrice === null ) {
    return null;
  }

  if ( normalizeCompact( row?.number ) !== normalizeCompact( card?.number ) ) {
    return null;
  }

  if ( !textMatches( row?.productName, card?.productName ) ) {
    return null;
  }

  if ( row?.set && card?.setName && !textMatches( row.set, card.setName ) ) {
    return null;
  }

  if ( !raritiesMatch( row?.rarity, card?.rarity ) ) {
    return null;
  }

  if ( !editionsMatch( row?.printing, card?.printing ) ) {
    return null;
  }

  let score = 0;

  if ( normalizeLooseText( row?.productName ) === normalizeLooseText( card?.productName ) ) {
    score += 40;
  } else {
    score += 24;
  }

  if ( normalizeCompact( row?.number ) && normalizeCompact( row?.number ) === normalizeCompact( card?.number ) ) {
    score += 30;
  }

  if ( normalizeLooseText( row?.set ) === normalizeLooseText( card?.setName ) ) {
    score += 15;
  }

  if ( normalizeRarityKey( row?.rarity ) === normalizeRarityKey( card?.rarity ) ) {
    score += 12;
  }

  if ( normalizeEditionKey( row?.printing ) === normalizeEditionKey( card?.printing ) ) {
    score += 8;
  }

  if ( normalizeConditionKey( row?.condition ) === normalizeConditionKey( card?.condition ) ) {
    score += 18;
  } else if ( conditionsMatch( row?.condition, card?.condition ) ) {
    score += 8;
  }

  return { row, price: rowPrice, score };
};

const findBestPriceRow = ( rows, card ) =>
  rows
    .map( ( row ) => scoreCandidate( row, card ) )
    .filter( Boolean )
    .sort( ( a, b ) => b.score - a.score )[ 0 ] || null;

const buildCardsBySet = ( cards ) => {
  const cardsBySet = new Map();

  ( Array.isArray( cards ) ? cards : [] ).forEach( ( card ) => {
    const setName = normalizeWhitespace( card?.setName );
    if ( !setName ) {
      return;
    }

    const setKey = normalizeLooseText( setName );
    const entry = cardsBySet.get( setKey );

    if ( entry ) {
      entry.cards.push( card );
      return;
    }

    cardsBySet.set( setKey, {
      setName,
      cards: [ card ],
    } );
  } );

  return cardsBySet;
};

const buildSetPlan = ( cardsBySet ) =>
  Array.from( cardsBySet.entries() )
    .map( ( [ setKey, entry ] ) => ( {
      setKey,
      setName: entry.setName,
      cardCount: entry.cards.length,
    } ) )
    .sort( ( a, b ) => b.cardCount - a.cardCount || a.setName.localeCompare( b.setName ) );

const resolveSetNameId = ( setNameIdMap, setName ) => {
  const normalizedSetName = normalizeWhitespace( setName );

  if ( !normalizedSetName ) {
    return null;
  }

  if ( setNameIdMap?.[ normalizedSetName ] ) {
    return setNameIdMap[ normalizedSetName ];
  }

  const normalizedKey = normalizeLooseText( normalizedSetName );
  const matchedEntry = Object.entries( setNameIdMap || {} ).find(
    ( [ mappedSetName ] ) => normalizeLooseText( mappedSetName ) === normalizedKey
  );

  return matchedEntry?.[ 1 ] || null;
};

const createRemoteFetchError = ( message, options = {} ) => {
  const error = new Error( message );
  error.status = options.status;
  error.rateLimited = Boolean( options.rateLimited );
  error.retryAfterMs = options.retryAfterMs ?? null;
  return error;
};

const fetchCurrentPriceRowsForSet = async ( { setName, setNameIdMap, deadline } ) => {
  const setNameId = resolveSetNameId( setNameIdMap, setName );

  if ( !setNameId ) {
    throw createRemoteFetchError( `Set name not found in mapping: ${ setName }`, { status: 404 } );
  }

  const url = `https://${ process.env.GET_CARD_DATA_API }/priceguide/set/${ setNameId }/cards/?rows=5000`;
  let lastError = null;

  for ( let attempt = 0; attempt <= REMOTE_FETCH_RETRY_LIMIT; attempt += 1 ) {
    const response = await fetch( url );

    if ( response.ok ) {
      const payload = await response.json();
      return slimPriceRows( extractCardRows( payload ) );
    }

    const isRateLimited = response.status === 429 || response.status === 503;
    const retryDelay = isRateLimited ? getRetryDelay( response ) * ( attempt + 1 ) : null;
    lastError = createRemoteFetchError(
      `Price-guide request failed with status ${ response.status }`,
      {
        status: response.status,
        rateLimited: isRateLimited,
        retryAfterMs: retryDelay,
      }
    );

    if ( !isRateLimited ) {
      break;
    }

    if (
      attempt >= REMOTE_FETCH_RETRY_LIMIT ||
      !hasTimeForRemoteFetch( deadline ) ||
      Date.now() + retryDelay + 5000 >= deadline
    ) {
      throw lastError;
    }

    await sleep( retryDelay );
  }

  throw lastError || createRemoteFetchError( "Price-guide request failed" );
};

const reconcileCompletedSetKeys = ( job, setPlan ) => {
  const currentSetsByKey = new Map( setPlan.map( ( setEntry ) => [ setEntry.setKey, setEntry ] ) );
  const previousSetsByKey = new Map(
    ( Array.isArray( job?.setPlan ) ? job.setPlan : [] ).map( ( setEntry ) => [ setEntry.setKey, setEntry ] )
  );

  return ( Array.isArray( job?.completedSetKeys ) ? job.completedSetKeys : [] ).filter( ( setKey ) => {
    const currentSet = currentSetsByKey.get( setKey );
    const previousSet = previousSetsByKey.get( setKey );

    return Boolean( currentSet && previousSet && currentSet.cardCount === previousSet.cardCount );
  } );
};

const findOrCreatePriceUpdateJob = async ( { jobCollection, userId, setPlan } ) => {
  const now = new Date();
  const activeJob = await jobCollection.findOne(
    { userId, status: { $in: ACTIVE_PRICE_UPDATE_STATUSES } },
    { sort: { updatedAt: -1 } }
  );

  if ( activeJob ) {
    const completedSetKeys = reconcileCompletedSetKeys( activeJob, setPlan );
    const failedSetKeys = ( Array.isArray( activeJob.failedSetKeys ) ? activeJob.failedSetKeys : [] )
      .filter( ( setKey ) => setPlan.some( ( setEntry ) => setEntry.setKey === setKey ) );
    const staleRunningJob =
      activeJob.status === "running" &&
      now.getTime() - new Date( activeJob.updatedAt || activeJob.createdAt || 0 ).getTime() > STALE_RUNNING_JOB_MS;

    await jobCollection.updateOne(
      { _id: activeJob._id },
      {
        $set: {
          status: "running",
          setPlan,
          totalSetCount: setPlan.length,
          completedSetKeys,
          failedSetKeys,
          updatedAt: now,
          resumedAt: now,
          staleRunningJob,
        },
        $inc: { runCount: 1 },
      }
    );

    return {
      ...activeJob,
      status: "running",
      setPlan,
      totalSetCount: setPlan.length,
      completedSetKeys,
      failedSetKeys,
      staleRunningJob,
    };
  }

  const insertResult = await jobCollection.insertOne( {
    userId,
    status: "running",
    setPlan,
    totalSetCount: setPlan.length,
    completedSetKeys: [],
    failedSetKeys: [],
    runCount: 1,
    createdAt: now,
    startedAt: now,
    updatedAt: now,
  } );

  return {
    _id: insertResult.insertedId,
    userId,
    status: "running",
    setPlan,
    totalSetCount: setPlan.length,
    completedSetKeys: [],
    failedSetKeys: [],
    runCount: 1,
    createdAt: now,
    startedAt: now,
    updatedAt: now,
  };
};

function createAuthError( message ) {
  const error = new Error( message );
  error.statusCode = 401;
  return error;
}

function resolveAuthContext( authContext ) {
  if ( !authContext ) {
    throw createAuthError( "Authorization token is required." );
  }

  if ( typeof authContext === "string" ) {
    const parts = authContext.trim().split( " " );
    const token = parts.length === 2 ? parts[ 1 ] : parts[ 0 ];
    if ( !token ) {
      throw createAuthError( "Invalid authorization format." );
    }

    try {
      const decoded = jwt.verify( token, process.env.JWT_SECRET );
      return { token, decoded };
    } catch ( error ) {
      console.error( "Invalid token:", error );
      throw createAuthError( "Unauthorized: Invalid token" );
    }
  }

  const { token, decoded } = authContext;

  if ( !decoded && !token ) {
    throw createAuthError( "Authorization token is required." );
  }

  if ( decoded ) {
    if ( !decoded.username ) {
      throw createAuthError( "Unauthorized: Invalid token payload" );
    }
    return { token, decoded };
  }

  try {
    const verified = jwt.verify( token, process.env.JWT_SECRET );
    if ( !verified.username ) {
      throw createAuthError( "Unauthorized: Invalid token payload" );
    }
    return { token, decoded: verified };
  } catch ( error ) {
    console.error( "Invalid token:", error );
    throw createAuthError( "Unauthorized: Invalid token" );
  }
}

export default async function updateCardPricesLogic( authContext ) {
  const { decoded } = resolveAuthContext( authContext );
  const userId = ensureSafeUserId( decoded.username );
  const client = await clientPromise;
  const db = client.db( "cardPriceApp" );
  const cardsCollection = db.collection( "myCollection" );
  const jobCollection = db.collection( PRICE_UPDATE_JOB_COLLECTION );
  const cards = await cardsCollection.find( { userId } ).toArray();
  const updateResults = [];
  const unmatchedCards = [];

  if ( cards.length === 0 ) {
    return {
      updated: [],
      unmatched: [],
      updatedCount: 0,
      unmatchedCount: 0,
      fetchedSetCount: 0,
      processedSetCount: 0,
      remainingSetCount: 0,
      totalSetCount: 0,
      complete: true,
    };
  }

  const cardsBySet = buildCardsBySet( cards );
  const cardsWithoutSet = cards.filter( ( card ) => !normalizeWhitespace( card?.setName ) );
  const setPlan = buildSetPlan( cardsBySet );
  const setNameIdMap = await getSetNameIdMap();
  const job = await findOrCreatePriceUpdateJob( { jobCollection, userId, setPlan } );
  const completedSetKeys = new Set( job.completedSetKeys || [] );
  const failedSetKeys = new Set( Array.isArray( job.failedSetKeys ) ? job.failedSetKeys : [] );
  const setFetchResults = [];
  const deadline = createDeadline();
  let processedSetCount = 0;
  let failedSetCount = 0;
  let rateLimited = false;
  let stoppedReason = null;
  let retryAfterMs = null;

  cardsWithoutSet.forEach( ( card ) => {
    unmatchedCards.push( {
      cardId: card._id,
      productName: card.productName,
      setName: card.setName,
      number: card.number,
      reason: "Card has no set name",
    } );
  } );

  for ( const planEntry of setPlan ) {
    if ( completedSetKeys.has( planEntry.setKey ) ) {
      continue;
    }

    if ( !hasTimeForRemoteFetch( deadline ) ) {
      stoppedReason = "deadline";
      break;
    }

    const entry = cardsBySet.get( planEntry.setKey );
    if ( !entry ) {
      completedSetKeys.add( planEntry.setKey );
      await jobCollection.updateOne(
        { _id: job._id },
        {
          $addToSet: { completedSetKeys: planEntry.setKey },
          $set: { updatedAt: new Date(), lastProcessedSet: planEntry.setName },
        }
      );
      continue;
    }

    let rows = [];

    try {
      await sleep( REMOTE_FETCH_DELAY_MS );
      rows = await fetchCurrentPriceRowsForSet( {
        setName: planEntry.setName,
        setNameIdMap,
        deadline,
      } );

      setFetchResults.push( {
        setName: planEntry.setName,
        rowsFetched: rows.length,
        ok: rows.length > 0,
        source: "remote",
      } );
    } catch ( error ) {
      console.error( `Failed to fetch price-guide rows for set ${ planEntry.setName }:`, error );

      if ( error?.rateLimited ) {
        rateLimited = true;
        stoppedReason = "rate_limited";
        retryAfterMs = error.retryAfterMs ?? null;
        setFetchResults.push( {
          setName: planEntry.setName,
          rowsFetched: 0,
          ok: false,
          source: "rate_limited",
          error: error?.message || "Price API rate limit reached",
        } );
        break;
      }

      failedSetCount += 1;
      failedSetKeys.add( planEntry.setKey );
      completedSetKeys.add( planEntry.setKey );
      setFetchResults.push( {
        setName: planEntry.setName,
        rowsFetched: 0,
        ok: false,
        source: "remote-failed",
        error: error?.message || "Set price data unavailable",
      } );

      entry.cards.forEach( ( card ) => {
        unmatchedCards.push( {
          cardId: card._id,
          productName: card.productName,
          setName: card.setName,
          number: card.number,
          reason: error?.message || "Set price data unavailable",
        } );
      } );

      await jobCollection.updateOne(
        { _id: job._id },
        {
          $addToSet: {
            completedSetKeys: planEntry.setKey,
            failedSetKeys: planEntry.setKey,
          },
          $set: { updatedAt: new Date(), lastProcessedSet: planEntry.setName },
        }
      );
      continue;
    }

    for ( const card of entry.cards ) {
      try {
        const match = findBestPriceRow( rows, card );

        if ( match ) {
          const newPrice = match.price;
          const matchedRow = match.row;
          const updateResult = await cardsCollection.updateOne(
            { _id: card._id, userId },
            {
              $set: {
                cardId: card.cardId ?? null,
                marketPrice: newPrice,
                lowPrice: parsePrice( matchedRow?.lowPrice ) ?? card.lowPrice ?? 0,
                oldPrice: card.marketPrice,
                updatedAt: new Date(),
              }
            }
          );

          await recordPriceHistoryEntry( {
            cardId: card.cardId ?? null,
            setName: matchedRow?.set || card.setName,
            number: matchedRow?.number || card.number,
            rarity: matchedRow?.rarity || card.rarity,
            edition: matchedRow?.printing || card.printing,
            price: newPrice
          } );

          updateResults.push( {
            cardId: card._id,
            productName: card.productName,
            setName: card.setName,
            number: card.number,
            newPrice,
            modifiedCount: updateResult.modifiedCount,
          } );
        } else {
          console.warn(
            `No price-guide row found for card: ${ card.productName } (Set: ${ card.setName }, Number: ${ card.number }, Rarity: ${ card.rarity }, Printing: ${ card.printing }, Condition: ${ card.condition })`
          );
          unmatchedCards.push( {
            cardId: card._id,
            productName: card.productName,
            setName: card.setName,
            number: card.number,
            rarity: card.rarity,
            printing: card.printing,
            condition: card.condition,
            reason: "No matching price-guide row",
          } );
        }
      } catch ( error ) {
        console.error( `Error updating card ${ card.productName }:`, error );
        unmatchedCards.push( {
          cardId: card._id,
          productName: card.productName,
          setName: card.setName,
          number: card.number,
          reason: error?.message || "Unexpected update error",
        } );
      }
    }

    processedSetCount += 1;
    completedSetKeys.add( planEntry.setKey );

    await jobCollection.updateOne(
      { _id: job._id },
      {
        $addToSet: { completedSetKeys: planEntry.setKey },
        $pull: { failedSetKeys: planEntry.setKey },
        $set: { updatedAt: new Date(), lastProcessedSet: planEntry.setName },
      }
    );
  }

  const remainingSetCount = setPlan.filter( ( setEntry ) => !completedSetKeys.has( setEntry.setKey ) ).length;
  const complete = remainingSetCount === 0;
  const status = complete ? "completed" : rateLimited ? "rate_limited" : "partial";
  const finalUpdate = {
    $set: {
      status,
      completedSetKeys: Array.from( completedSetKeys ),
      failedSetKeys: Array.from( failedSetKeys ),
      completedSetCount: completedSetKeys.size,
      remainingSetCount,
      totalSetCount: setPlan.length,
      lastRunUpdatedCount: updateResults.length,
      lastRunUnmatchedCount: unmatchedCards.length,
      lastRunProcessedSetCount: processedSetCount,
      lastRunFailedSetCount: failedSetCount,
      lastRunRateLimited: rateLimited,
      lastRunStoppedReason: stoppedReason,
      updatedAt: new Date(),
    },
  };

  if ( complete ) {
    finalUpdate.$set.completedAt = new Date();
  } else {
    finalUpdate.$unset = { completedAt: "" };
  }

  await jobCollection.updateOne( { _id: job._id }, finalUpdate );

  return {
    jobId: job._id.toString(),
    updated: updateResults,
    unmatched: unmatchedCards,
    updatedCount: updateResults.length,
    unmatchedCount: unmatchedCards.length,
    processedSetCount,
    failedSetCount,
    fetchedSetCount: setFetchResults.length,
    fetchedSets: setFetchResults,
    completedSetCount: completedSetKeys.size,
    remainingSetCount,
    totalSetCount: setPlan.length,
    totalCollectionCardCount: cards.length,
    complete,
    rateLimited,
    stoppedReason,
    retryAfterMs,
    nextAction: complete ? "done" : "resume",
  };
}
