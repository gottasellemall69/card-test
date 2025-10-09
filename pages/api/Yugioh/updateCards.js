import { MongoClient, ObjectId } from "mongodb";
import { requireUser } from "@/middleware/authenticate";

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

  let sanitizedValue = value;

  if ( NUMERIC_FIELDS.has( field ) ) {
    const numericValue = Number( value );
    if ( Number.isNaN( numericValue ) || !Number.isFinite( numericValue ) ) {
      return res.status( 400 ).json( { message: "Invalid numeric value" } );
    }

    if ( field === "quantity" && numericValue < 0 ) {
      return res.status( 400 ).json( { message: "Quantity cannot be negative" } );
    }

    sanitizedValue = numericValue;
  }

  const client = new MongoClient( process.env.MONGODB_URI );

  try {
    await client.connect();
    const db = client.db( "cardPriceApp" );
    const cards = db.collection( "myCollection" );

    const result = await cards.updateOne(
      { _id: new ObjectId( cardId ), userId: auth.decoded.username },
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
  } finally {
    await client.close();
  }
}
