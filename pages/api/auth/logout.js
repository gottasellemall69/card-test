export default function handler( req, res ) {
    if ( req.method !== "POST" ) {
        res.setHeader( "Allow", [ "POST" ] );
        return res.status( 405 ).json( { message: `Method ${ req.method } Not Allowed` } );
    }

    const isProduction = process.env.NODE_ENV === "production";
    const sharedAttributes = [
        "Path=/",
        "Max-Age=0",
        "SameSite=Strict",
    ];
    if ( isProduction ) {
        sharedAttributes.push( "Secure" );
    }

    res.setHeader(
        "Set-Cookie",
        [
            `token=; HttpOnly; ${ sharedAttributes.join( "; " ) }`,
            `auth_state=; ${ sharedAttributes.join( "; " ) }`,
        ]
    );
    return res.status( 200 ).json( { message: "Logged out" } );
}
