import updateCardPricesLogic from '@/utils/updateCardPricesLogic';

export default async function handler( req, res ) {
  try {
    const authHeader =
      req.headers.authorization ||
      ( req.cookies.token ? `Bearer ${ req.cookies.token }` : undefined );

    if ( !authHeader ) {
      return res.status( 401 ).json( { error: "Unauthorized" } );
    }

    const result = await updateCardPricesLogic( authHeader );
    res.status( 200 ).json( { message: "Prices updated successfully", result } );
  } catch ( error ) {
    console.error( "Error updating card prices:", error );
    res.status( 500 ).json( { error: error.message } );
  }
}
