import type { NextApiResponse } from 'next';
import { createHash } from 'node:crypto';
import { requireUser, type AuthenticatedRequest } from './auth';
import { HttpError, publicError } from './errors';
import { getDatabase } from './database';

type RouteOptions = { methods: string[]; auth?: boolean; limit?: number; scope?: string };
type Handler = (req: AuthenticatedRequest, res: NextApiResponse) => unknown | Promise<unknown>;
const writes = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const buckets = new Map<string, { count: number; expires: number }>();

export function requestAddress(req: AuthenticatedRequest) {
  if (process.env.TRUST_PROXY === 'true') {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') return forwarded.split(',')[0].trim().slice(0, 64);
  }
  return req.socket?.remoteAddress || 'unknown';
}

export function assertSameOrigin(req: AuthenticatedRequest) {
  if (!writes.has(req.method || '')) return;
  if (req.headers['sec-fetch-site'] === 'cross-site')
    throw new HttpError(403, 'Cross-site request denied');
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const supplied = origin || referer;
  if (!supplied) {
    if (req.cookies?.token && !req.headers.authorization?.match(/^Bearer [^\s]+$/i))
      throw new HttpError(403, 'Request origin is required');
    return; // Cookie-less API clients still require authentication for protected writes.
  }
  let url: URL;
  try {
    url = new URL(supplied);
  } catch {
    throw new HttpError(403, 'Invalid request origin');
  }
  const configured = process.env.APP_URL;
  if (configured) {
    if (url.origin !== new URL(configured).origin)
      throw new HttpError(403, 'Cross-site request denied');
  } else if (!['http:', 'https:'].includes(url.protocol) || url.host !== req.headers.host) {
    throw new HttpError(403, 'Cross-site request denied');
  }
}

function throttle(req: AuthenticatedRequest, res: NextApiResponse, options: RouteOptions) {
  const now = Date.now();
  const key = `${options.scope || req.url?.split('?')[0]}:${requestAddress(req)}`;
  const old = buckets.get(key);
  const bucket = old && old.expires > now ? old : { count: 0, expires: now + 60000 };
  bucket.count += 1;
  buckets.set(key, bucket);
  if (buckets.size > 10000) {
    for (const [id, value] of buckets) if (value.expires <= now) buckets.delete(id);
    if (buckets.size > 10000) buckets.delete(buckets.keys().next().value!);
  }
  if (bucket.count > (options.limit || 120)) {
    res.setHeader('Retry-After', String(Math.ceil((bucket.expires - now) / 1000)));
    throw new HttpError(429, 'Too many requests. Please try again later.');
  }
}

// Persistent login/register limits apply across server instances.
export async function limitAuthAttempts(req: AuthenticatedRequest, username: string) {
  const windowMs = 15 * 60 * 1000;
  const window = Math.floor(Date.now() / windowMs);
  const db = await getDatabase();
  for (const [subject, max] of [
    [`ip:${requestAddress(req)}`, 30],
    [`name:${username}`, 10],
  ] as const) {
    const id = createHash('sha256')
      .update(`${req.url?.split('?')[0]}:${subject}:${window}`)
      .digest('hex');
    const bucket = await db
      .collection<{ _id: string; count: number; expiresAt: Date }>('authRateLimits')
      .findOneAndUpdate(
        { _id: id },
        { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 1) * windowMs) } },
        { upsert: true, returnDocument: 'after' },
      );
    if (bucket && bucket.count > max)
      throw new HttpError(429, 'Too many attempts. Please try again later.');
  }
}

export function apiRoute(options: RouteOptions, handler: Handler) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    res.setHeader('Cache-Control', 'private, no-store');
    try {
      if (!options.methods.includes(req.method || '')) {
        res.setHeader('Allow', options.methods.join(', '));
        throw new HttpError(405, 'Method not allowed');
      }
      assertSameOrigin(req);
      for (const [key, value] of Object.entries(req.query)) {
        if (key === 'cardId' && Array.isArray(value) && value.length === 1)
          req.query[key] = value[0];
        else if (
          Array.isArray(value) ||
          (value !== undefined && (typeof value !== 'string' || value.length > 512))
        ) {
          throw new HttpError(400, 'Invalid query parameters');
        }
      }
      if (writes.has(req.method || '') && req.body !== undefined && req.body !== '') {
        if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) {
          throw new HttpError(415, 'Content-Type must be application/json');
        }
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
          throw new HttpError(400, 'A JSON object is required');
        }
      }
      throttle(req, res, options);
      if (options.auth) await requireUser(req, res);
      await handler(req, res);
    } catch (error) {
      if (res.headersSent) return;
      const { status, message } = publicError(error);
      // Do not log credentials, request bodies, database URLs, or raw upstream errors.
      if (status >= 500) console.error(`API ${req.url?.split('?')[0]} failed (${status})`);
      res.status(status).json({ error: message, message });
    }
  };
}

export function queryString(value: unknown, name: string, maxLength = 256) {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new HttpError(400, `Invalid ${name}`);
  }
  return value.trim();
}
