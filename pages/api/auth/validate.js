import jwt from "jsonwebtoken";

export default function handler( req, res ) {
    const token = req.cookies?.token;
    if ( !token ) {
        return res.status( 401 ).json( { authenticated: false } );
    }

    try {
        const decoded = jwt.verify( token, process.env.JWT_SECRET );
        // We intentionally return username so the UI can show it
        return res.status( 200 ).json( { authenticated: true, username: decoded.username } );
    } catch {
        return res.status( 401 ).json( { authenticated: false } );
    }
}
