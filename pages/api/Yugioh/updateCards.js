import { ObjectId } from "mongodb";
import { requireUser } from "@/middleware/authenticate";
import clientPromise from "@/utils/mongo.js";
import { ensureSafeUserId, coerceNumberField, coerceStringField } from "@/utils/securityValidators.js";

const ALLOWED_FIELDS = new Set( [
  "quantity",
  "condition",
  "marketPrice",
  "lowPrice",
  "oldPrice",
  "printing",
  "rarity"
] );

const NUMERIC_FIELDS = new Set( [
  "quantity",
  "marketPrice",
  "lowPrice",
  "oldPrice"
] );

export default async function handler( req, res ) {
  if ( req.method !== "PATCH" ) {
    res.setHeader( "Allow", [ "PATCH" ] );
    return res.status( 405 ).json( { message: `Method ${ req.method } Not Allowed` } );
  }

  const auth = await requireUser( req, res );
  if ( !auth ) {
    return;
  }

  const { cardId, field, value } = req.body ?? {};

  if ( typeof cardId !== "string" || !ObjectId.isValid( cardId ) ) {
    return res.status( 400 ).json( { message: "Invalid card identifier" } );
  }

  if ( typeof field !== "string" || !ALLOWED_FIELDS.has( field ) ) {
    return res.status( 400 ).json( { message: "Invalid update field" } );
  }

  if ( value === undefined || value === null ) {
    return res.status( 400 ).json( { message: "Missing update value" } );
  }

  try {
    let sanitizedValue;

    if ( NUMERIC_FIELDS.has( field ) ) {
      sanitizedValue = coerceNumberField( value, {
        min: field === "quantity" ? 0 : Number.NEGATIVE_INFINITY,
      } );
    } else {
      sanitizedValue = coerceStringField( value, { maxLength: 256, allowEmpty: true } );
    }

    const client = await clientPromise;
    const db = client.db( "cardPriceApp" );
    const cards = db.collection( "myCollection" );
    const safeUserId = ensureSafeUserId( auth.decoded.username );

    const result = await cards.updateOne(
      { _id: new ObjectId( cardId ), userId: safeUserId },
      { $set: { [ field ]: sanitizedValue } }
    );

    if ( result.modifiedCount > 0 ) {
      return res.status( 200 ).json( { message: "Card updated successfully" } );
    }

    return res.status( 404 ).json( {
      message: "Card not found or does not belong to the user"
    } );
  } catch ( error ) {
    console.error( "Update error:", error );
    return res.status( 500 ).json( { message: `Internal server error: ${ error.message }` } );
  }
}
