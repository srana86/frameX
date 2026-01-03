import { MongoClient, type Db, type Document } from "mongodb";

const uri = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB || "shoestore_main";

if (!uri) {
  console.warn("MONGODB_URI is not set. API routes using DB will fail until configured.");
}

type GlobalWithMongo = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

let clientPromise: Promise<MongoClient>;

const g = global as GlobalWithMongo;

if (!g._mongoClientPromise) {
  const client = new MongoClient(uri);
  g._mongoClientPromise = client.connect();
}

clientPromise = g._mongoClientPromise as Promise<MongoClient>;

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

export async function getCollection<T extends Document = Document>(name: string) {
  const db = await getDb();
  return db.collection<T>(name);
}

