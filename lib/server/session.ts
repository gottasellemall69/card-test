import jwt from 'jsonwebtoken';
import { HttpError } from './errors';

export type SessionUser = { userId: string; username: string };
export const SESSION_SECONDS = 86400;

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new HttpError(503, 'Authentication is not configured');
  }
  return secret;
}

export function signSession(user: SessionUser) {
  return jwt.sign(user, getSecret(), {
    algorithm: 'HS256',
    issuer: 'card-price-app',
    audience: 'card-price-app',
    expiresIn: SESSION_SECONDS,
  });
}

export function verifySession(token: string | null | undefined): SessionUser | null {
  if (!token || token.length > 4096) return null;
  const secret = getSecret();
  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: 'card-price-app',
      audience: 'card-price-app',
    });
    if (typeof decoded !== 'object') return null;
    if (
      typeof decoded.exp !== 'number' ||
      typeof decoded.userId !== 'string' ||
      !/^[a-f\d]{24}$/i.test(decoded.userId) ||
      typeof decoded.username !== 'string' ||
      !/^[A-Za-z0-9@._-]{1,128}$/.test(decoded.username)
    )
      return null;
    return { userId: decoded.userId, username: decoded.username };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: {
  headers?: { authorization?: string };
  cookies?: Partial<Record<string, string>>;
}) {
  const bearer = req.headers?.authorization?.match(/^Bearer ([^\s]+)$/i)?.[1];
  return bearer || req.cookies?.token || null;
}

export function sessionCookies(token: string | null) {
  const attributes = `Path=/; SameSite=Strict; Max-Age=${token ? SESSION_SECONDS : 0}${
    process.env.NODE_ENV === 'production' ? '; Secure' : ''
  }`;
  return [
    `token=${token || ''}; HttpOnly; ${attributes}`,
    // UI hint only. Authorization always verifies the HttpOnly token on the server.
    `auth_state=${token ? '1' : ''}; ${attributes}`,
  ];
}
