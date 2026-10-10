import type { MongoClient } from 'mongodb';
import { getMongoClient } from '@/lib/server/database';

// Compatibility for existing `await clientPromise` callers without eager connection.
const clientPromise: PromiseLike<MongoClient> = {
  then: (resolve, reject) => getMongoClient().then(resolve, reject),
};
export default clientPromise;
