declare module "@/utils/mongo" {
  import { MongoClient } from "mongodb";
  const clientPromise: Promise<MongoClient>;
  export default clientPromise;
}
