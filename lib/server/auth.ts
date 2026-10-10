import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getDatabase } from './database';
import { HttpError } from './errors';
import { getTokenFromRequest, sessionCookies, verifySession, type SessionUser } from './session';

export type AuthResult = { token: string; decoded: SessionUser };
export type AuthenticatedRequest = NextApiRequest & { auth?: AuthResult; user?: SessionUser };

export async function getSessionUser(req: NextApiRequest): Promise<AuthResult | null> {
  const token = getTokenFromRequest(req);
  const decoded = verifySession(token);
  if (!token || !decoded) return null;
  const db = await getDatabase();
  const user = await db
    .collection('users')
    .findOne(
      { _id: new ObjectId(decoded.userId), username: decoded.username },
      { projection: { _id: 1 } },
    );
  return user ? { token, decoded } : null;
}

export async function requireUser(req: AuthenticatedRequest, res: NextApiResponse) {
  const auth = await getSessionUser(req);
  if (!auth) {
    res.setHeader('Set-Cookie', sessionCookies(null));
    throw new HttpError(401, 'Unauthorized');
  }
  req.auth = auth;
  req.user = auth.decoded;
  return auth;
}

export { getTokenFromRequest } from './session';
