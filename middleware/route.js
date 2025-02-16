import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

export default withApiAuthRequired(async function authenticate(req, res, next) {
    const { user } = getSession(req, res);

    if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = user;
    next();
});
