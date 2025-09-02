export default function handler( req, res ) {
    if ( req.method !== "POST" ) {
        res.setHeader( "Allow", [ "POST" ] );
        return res.status( 405 ).json( { message: `Method ${ req.method } Not Allowed` } );
    }

    // Expire cookie
    res.setHeader(
        "Set-Cookie",
        "token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict; Secure"
    );
    return res.status( 200 ).json( { message: "Logged out" } );
}
