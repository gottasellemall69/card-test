import { requireUser } from '@/lib/server/auth';
export { requireUser, getTokenFromRequest } from '@/lib/server/auth';

export default async function authenticate(req, res, next) {
  await requireUser(req, res);
  return typeof next === 'function' ? next() : undefined;
}
