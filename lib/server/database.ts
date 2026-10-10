import { MongoClient } from 'mongodb';
import { HttpError } from './errors';

const mongo = globalThis as typeof globalThis & {
  cardAppMongo?: { uri: string; promise: Promise<MongoClient> };
};

// Connect only when a request needs MongoDB, never during import or a Next.js build.
export function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new HttpError(503, 'Database is not configured');
  if (!mongo.cardAppMongo || mongo.cardAppMongo.uri !== uri) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    const promise = client.connect().catch(async () => {
      if (mongo.cardAppMongo?.promise === promise) delete mongo.cardAppMongo;
      await client.close().catch(() => undefined);
      throw new HttpError(503, 'Database is temporarily unavailable');
    });
    mongo.cardAppMongo = { uri, promise };
  }
  return mongo.cardAppMongo.promise;
}

export async function getDatabase() {
  return (await getMongoClient()).db(process.env.MONGODB_DATABASE || 'cardPriceApp');
}

export async function closeDatabase() {
  const connection = mongo.cardAppMongo;
  delete mongo.cardAppMongo;
  if (connection) await (await connection.promise.catch(() => null))?.close();
}
