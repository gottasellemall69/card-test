import { ObjectId } from "mongodb";
import { requireUser } from "@/proxy/authenticate";
import clientPromise from "@/utils/mongo.js";
import { ensureSafeUserId } from "@/utils/securityValidators.js";

const MAX_CARD_IDS_PER_REQUEST = 500;

const sanitizeObjectIds = ( values ) => {
  if ( !Array.isArray( values ) || values.length === 0 ) {
    throw new Error( "Select at least one card." );
  }

  if ( values.length > MAX_CARD_IDS_PER_REQUEST ) {
    throw new Error( `You can update up to ${ MAX_CARD_IDS_PER_REQUEST } cards at once.` );
  }

  return [ ...new Set( values ) ].map( ( value ) => {
    if ( typeof value !== "string" || !ObjectId.isValid( value ) ) {
      throw new Error( "Invalid card identifier." );
    }

    return new ObjectId( value );
  } );
};

export default async function handler( req, res ) {
  if ( req.method !== "PATCH" ) {
    res.setHeader( "Allow", [ "PATCH" ] );
    return res.status( 405 ).json( { message: `Method ${ req.method } Not Allowed` } );
  }

  const auth = await requireUser( req, res );
  if ( !auth ) {
    return;
  }

  try {
    const userId = ensureSafeUserId( auth.decoded.username );
    const folderId = req.body?.folderId;
    const action = req.body?.action;

    if ( typeof folderId !== "string" || !ObjectId.isValid( folderId ) ) {
      return res.status( 400 ).json( { message: "Invalid folder identifier." } );
    }

    if ( action !== "add" && action !== "remove" ) {
      return res.status( 400 ).json( { message: "Invalid folder action." } );
    }

    const cardObjectIds = sanitizeObjectIds( req.body?.cardIds );
    const client = await clientPromise;
    const db = client.db( "cardPriceApp" );
    const folders = db.collection( "collectionFolders" );
    const cards = db.collection( "myCollection" );

    const folder = await folders.findOne( { _id: new ObjectId( folderId ), userId } );
    if ( !folder ) {
      return res.status( 404 ).json( { message: "Folder not found." } );
    }

    const update = action === "add"
      ? { $addToSet: { folderIds: folderId } }
      : { $pull: { folderIds: folderId } };

    const result = await cards.updateMany(
      { _id: { $in: cardObjectIds }, userId },
      update,
    );

    return res.status( 200 ).json( {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    } );
  } catch ( error ) {
    const status = /select|invalid|update up to/i.test( error.message ) ? 400 : 500;
    console.error( "Card folder update error:", error );
    return res.status( status ).json( { message: error.message || "Server error" } );
  }
}
