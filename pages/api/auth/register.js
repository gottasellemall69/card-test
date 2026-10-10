import bcrypt from 'bcryptjs';
import { apiRoute, limitAuthAttempts } from '@/lib/server/http';
import { getDatabase } from '@/lib/server/database';
import { HttpError } from '@/lib/server/errors';
import { ensureSafeUserId } from '@/utils/securityValidators';

export default apiRoute({ methods: ['POST'], scope: 'auth', limit: 30 }, async (req, res) => {
  const username = ensureSafeUserId(req.body?.username);
  const password = req.body?.password;
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 72) {
    throw new HttpError(400, 'Password must be at least 8 characters and at most 72 bytes');
  }
  await limitAuthAttempts(req, username);
  const db = await getDatabase();
  const users = db.collection('users');
  // The unique index makes concurrent registrations safe; old duplicates need db:setup cleanup.
  await users.createIndex({ username: 1 }, { unique: true });
  if (await users.findOne({ username }, { projection: { _id: 1 } })) {
    throw new HttpError(409, 'Username is already taken.');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const legacy = await users
    .find({ userId: { $type: 'number' } })
    .sort({ userId: -1 })
    .limit(1)
    .next();
  await db.collection('counters').createIndex({ key: 1 }, { unique: true });
  await db
    .collection('counters')
    .updateOne({ key: 'userId' }, { $max: { value: legacy?.userId || 0 } }, { upsert: true });
  const counter = await db
    .collection('counters')
    .findOneAndUpdate({ key: 'userId' }, { $inc: { value: 1 } }, { returnDocument: 'after' });
  try {
    await users.insertOne({
      username,
      password: passwordHash,
      createdAt: new Date(),
      userId: counter.value,
    });
  } catch (error) {
    if (error?.code === 11000) throw new HttpError(409, 'Username is already taken.');
    throw error;
  }
  return res.status(201).json({ message: 'User registered successfully.' });
});
export const config = { api: { bodyParser: { sizeLimit: '8kb' } } };
