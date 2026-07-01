import { requireUser } from "@/proxy/authenticate";
import clientPromise from "@/utils/mongo.js";
import { ensureSafeUserId } from "@/utils/securityValidators.js";
import fs from "fs/promises";
import path from "path";

const CARD_DATA_PATH = path.join( process.cwd(), "public", "card-data", "Yugioh", "card_data.json" );

let cachedCardImageIndex = null;

const normalizeToken = ( value ) =>
  ( value ?? "" ).toString().toLowerCase().replace( /[^a-z0-9]+/g, "" ).trim();

const getPrimaryCardImage = ( card ) =>
  Array.isArray( card?.card_images )
    ? card.card_images.find( ( image ) => image?.id || image?.image_url || image?.image_url_cropped || image?.image_url_small )
    : null;

const hasRemoteImageSource = ( card ) => {
  const primaryCardImage = getPrimaryCardImage( card );
  return Boolean(
    card?.remoteImageUrl ||
    card?.image_url ||
    primaryCardImage?.image_url ||
    primaryCardImage?.image_url_cropped ||
    primaryCardImage?.image_url_small
  );
};

const readCardImageIndex = async () => {
  if ( cachedCardImageIndex ) {
    return cachedCardImageIndex;
  }

  const fileContents = await fs.readFile( CARD_DATA_PATH, "utf8" );
  const parsed = JSON.parse( fileContents );
  const cards = Array.isArray( parsed?.data ) ? parsed.data : Array.isArray( parsed ) ? parsed : [];
  const byId = new Map();
  const byName = new Map();
  const bySetCode = new Map();
  const bySetNameAndCode = new Map();

  cards.forEach( ( card ) => {
    const primaryImage = getPrimaryCardImage( card );
    if ( !primaryImage?.id && !primaryImage?.image_url ) {
      return;
    }

    const imageMeta = {
      cardId: card?.id ? String( card.id ) : primaryImage?.id ? String( primaryImage.id ) : null,
      card_images: [ {
        id: primaryImage?.id ?? card?.id ?? null,
        image_url: primaryImage?.image_url ?? null,
        image_url_small: primaryImage?.image_url_small ?? null,
        image_url_cropped: primaryImage?.image_url_cropped ?? null,
      } ],
      remoteImageUrl: primaryImage?.image_url ?? null,
    };

    if ( imageMeta.cardId ) {
      byId.set( normalizeToken( imageMeta.cardId ), imageMeta );
    }

    const nameKey = normalizeToken( card?.name );
    if ( nameKey && !byName.has( nameKey ) ) {
      byName.set( nameKey, imageMeta );
    }

    if ( Array.isArray( card?.card_sets ) ) {
      card.card_sets.forEach( ( setEntry ) => {
        const setCodeKey = normalizeToken( setEntry?.set_code );
        if ( setCodeKey && !bySetCode.has( setCodeKey ) ) {
          bySetCode.set( setCodeKey, imageMeta );
        }

        const setNameCodeKey = `${ normalizeToken( setEntry?.set_name ) }::${ setCodeKey }`;
        if ( setCodeKey && !bySetNameAndCode.has( setNameCodeKey ) ) {
          bySetNameAndCode.set( setNameCodeKey, imageMeta );
        }
      } );
    }
  } );

  cachedCardImageIndex = { byId, byName, bySetCode, bySetNameAndCode };
  return cachedCardImageIndex;
};

const findImageMeta = ( card, index ) => {
  const idCandidates = [ card?.cardId, card?.cardImageId, card?.id ];
  for ( const candidate of idCandidates ) {
    const match = index.byId.get( normalizeToken( candidate ) );
    if ( match ) return match;
  }

  const setCodeKey = normalizeToken( card?.number );
  const setNameCodeKey = `${ normalizeToken( card?.setName ) }::${ setCodeKey }`;
  return (
    index.bySetNameAndCode.get( setNameCodeKey ) ||
    index.bySetCode.get( setCodeKey ) ||
    index.byName.get( normalizeToken( card?.productName ) ) ||
    null
  );
};

const enrichCollectionCardImages = async ( cards ) => {
  if ( !Array.isArray( cards ) || cards.every( hasRemoteImageSource ) ) {
    return cards;
  }

  try {
    const index = await readCardImageIndex();
    return cards.map( ( card ) => {
      if ( hasRemoteImageSource( card ) ) {
        return card;
      }

      const imageMeta = findImageMeta( card, index );
      return imageMeta
        ? {
          ...card,
          cardId: card?.cardId ?? imageMeta.cardId,
          cardImageId: card?.cardImageId ?? imageMeta.cardId,
          remoteImageUrl: imageMeta.remoteImageUrl ?? card?.remoteImageUrl ?? null,
          card_images: Array.isArray( card?.card_images ) && card.card_images.length > 0
            ? card.card_images
            : imageMeta.card_images,
        }
        : card;
    } );
  } catch ( error ) {
    console.error( "Unable to enrich collection card images:", error );
    return cards;
  }
};

export default async function handler( req, res ) {
  const auth = await requireUser( req, res );
  if ( !auth ) {
    return;
  }

  const userId = ensureSafeUserId( auth.decoded.username );
  const client = await clientPromise;

  try {
    const collection = client.db( "cardPriceApp" ).collection( "myCollection" );

    switch ( req.method ) {
      case "GET": {
        const agg = [
          { $match: { userId } },
          {
            $project: {
              _id: 1,
              cardId: 1,
              productName: 1,
              setName: 1,
              number: 1,
              printing: 1,
              rarity: 1,
              condition: 1,
              oldPrice: 1,
              marketPrice: 1,
              lowPrice: 1,
              remoteImageUrl: 1,
              cardImageId: 1,
              card_images: 1,
              image_url: 1,
              id: 1,
              quantity: 1,
              folderIds: 1,
            },
          },
          { $sort: { _id: 1 } },
        ];

        const result = await collection.aggregate( agg ).toArray();
        const enrichedResult = await enrichCollectionCardImages( result );
        return res.status( 200 ).json( enrichedResult );
      }

      default:
        res.setHeader( "Allow", [ "GET" ] );
        return res.status( 405 ).end( `Method ${ req.method } Not Allowed` );
    }
  } catch ( error ) {
    console.error( "Error executing aggregation query:", error );
    return res.status( 500 ).json( { message: "Server error" } );
  }
}

