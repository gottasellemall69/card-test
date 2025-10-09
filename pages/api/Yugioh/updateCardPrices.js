import updateCardPricesLogic from "@/utils/updateCardPricesLogic";
import { requireUser } from "@/middleware/authenticate";

export default async function handler( req, res ) {
  if ( req.method !== "POST" ) {
    res.setHeader( "Allow", [ "POST" ] );
    return res.status( 405 ).json( { error: `Method ${ req.method } Not Allowed` } );
  }

  const auth = await requireUser( req, res );
  if ( !auth ) {
    return;
  }

  try {
    const result = await updateCardPricesLogic( { token: auth.token, decoded: auth.decoded } );
    return res.status( 200 ).json( { message: "Prices updated successfully", result } );
  } catch ( error ) {
    if ( error?.statusCode === 401 ) {
      return res.status( 401 ).json( { error: error.message } );
    }

    console.error( "Error updating card prices:", error );
    return res.status( 500 ).json( { error: error.message ?? "Internal server error" } );
  }
}
