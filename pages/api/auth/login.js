import bcrypt from 'bcryptjs';
import { apiRoute, limitAuthAttempts } from '@/lib/server/http';
import { getDatabase } from '@/lib/server/database';
import { HttpError } from '@/lib/server/errors';
import { signSession, sessionCookies } from '@/lib/server/session';
import { ensureSafeUserId } from '@/utils/securityValidators';

let dummyHash;
export default apiRoute({ methods: ['POST'], scope: 'auth', limit: 30 }, async (req, res) => {
  const username = ensureSafeUserId(req.body?.username);
  const password = req.body?.password;
  if (typeof password !== 'string' || !password || Buffer.byteLength(password) > 72) {
    throw new HttpError(400, 'Invalid username or password');
  }
  await limitAuthAttempts(req, username);
  const db = await getDatabase();
  const user = await db.collection('users').findOne({ username });
  dummyHash ||= bcrypt.hash('not-a-user-password', 12);
  const valid = await bcrypt.compare(password, user?.password || (await dummyHash));
  if (!user || !valid) throw new HttpError(401, 'Invalid username or password');
  const token = signSession({ userId: user._id.toString(), username: user.username });
  res.setHeader('Set-Cookie', sessionCookies(token));
  return res.status(200).json({ message: 'Logged in!' });
});
export const config = { api: { bodyParser: { sizeLimit: '8kb' } } };
