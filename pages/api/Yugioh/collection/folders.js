import { apiRoute } from '@/lib/server/http';
import { HttpError } from '@/lib/server/errors';
import { ObjectId } from 'mongodb';
import clientPromise from '@/utils/mongo';
import { ensureSafeUserId, coerceStringField } from '@/utils/securityValidators.js';

const FOLDERS_COLLECTION = 'collectionFolders';
const CARDS_COLLECTION = 'myCollection';
const MAX_FOLDER_NAME_LENGTH = 80;

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getFolderId = (value) => {
  if (typeof value !== 'string' || !ObjectId.isValid(value)) {
    throw new HttpError(400, 'Invalid folder identifier');
  }

  return value;
};

async function handler(req, res) {
  const auth = req.auth;

  let userId;
  try {
    userId = ensureSafeUserId(auth.decoded.username);
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE || 'cardPriceApp');
    const folders = db.collection(FOLDERS_COLLECTION);
    const cards = db.collection(CARDS_COLLECTION);

    switch (req.method) {
      case 'GET': {
        const result = await folders
          .find({ userId }, { projection: { userId: 0 } })
          .sort({ name: 1, _id: 1 })
          .toArray();

        return res.status(200).json(result);
      }

      case 'POST': {
        const name = coerceStringField(req.body?.name, { maxLength: MAX_FOLDER_NAME_LENGTH });
        const now = new Date();
        const existing = await folders.findOne({
          userId,
          name: { $regex: `^${escapeRegExp(name)}$`, $options: 'i' },
        });

        if (existing) {
          return res.status(409).json({ message: 'A folder with this name already exists.' });
        }

        const result = await folders.insertOne({
          userId,
          name,
          createdAt: now,
          updatedAt: now,
        });

        return res.status(201).json({
          _id: result.insertedId.toString(),
          name,
          createdAt: now,
          updatedAt: now,
        });
      }

      case 'PATCH': {
        const folderId = getFolderId(req.body?.folderId);
        const name = coerceStringField(req.body?.name, { maxLength: MAX_FOLDER_NAME_LENGTH });
        const now = new Date();

        const duplicate = await folders.findOne({
          userId,
          _id: { $ne: new ObjectId(folderId) },
          name: { $regex: `^${escapeRegExp(name)}$`, $options: 'i' },
        });

        if (duplicate) {
          return res.status(409).json({ message: 'A folder with this name already exists.' });
        }

        const result = await folders.findOneAndUpdate(
          { _id: new ObjectId(folderId), userId },
          { $set: { name, updatedAt: now } },
          { returnDocument: 'after', projection: { userId: 0 } },
        );

        const updatedFolder = result?.value || result;

        if (!updatedFolder) {
          return res.status(404).json({ message: 'Folder not found.' });
        }

        return res.status(200).json(updatedFolder);
      }

      case 'DELETE': {
        const folderId = getFolderId(req.body?.folderId);
        const result = await folders.deleteOne({ _id: new ObjectId(folderId), userId });

        if (result.deletedCount === 0) {
          return res.status(404).json({ message: 'Folder not found.' });
        }

        await cards.updateMany({ userId, folderIds: folderId }, { $pull: { folderIds: folderId } });

        return res.status(200).json({ message: 'Folder deleted.' });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    if (error?.statusCode) throw error;
    console.error('Card API request failed');
    return res.status(500).json({ message: 'Server error' });
  }
}

export default apiRoute({ methods: ['GET', 'POST', 'PATCH', 'DELETE'], auth: true }, handler);
