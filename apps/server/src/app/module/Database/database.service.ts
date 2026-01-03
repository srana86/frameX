import { Database } from "./database.model";
import { MongoClient } from "mongodb";
import { toPlainObjectArray } from "../../utils/mongodb";
import { IDatabase } from "./database.interface";
import config from "../../../config/index";

const getAllDatabases = async () => {
  const uri = config.database_url;
  if (!uri) {
    throw new Error("MONGODB_URI not configured");
  }

  const client = new MongoClient(uri);
  await client.connect();

  try {
    // Get all databases
    const adminDb = client.db().admin();
    const { databases } = await adminDb.listDatabases();

    // Get merchant databases info
    let dbInfo: any[] = [];
    try {
      dbInfo = await Database.find({});
    } catch (error) {
      console.log("merchant_databases collection not found, continuing...");
    }

    // Map database info
    const databasesList = databases
      .filter(
        (db) =>
          db.name !== "admin" && db.name !== "local" && db.name !== "config"
      )
      .map((db) => {
        const info = dbInfo.find((d: any) => d.databaseName === db.name);
        return {
          name: db.name,
          sizeOnDisk: db.sizeOnDisk,
          empty: db.empty,
          merchantId: info?.merchantId || null,
          createdAt: info?.createdAt || null,
          connectionString: info?.connectionString ? "***encrypted***" : null,
        };
      });

    return databasesList;
  } finally {
    await client.close();
  }
};

export const DatabaseServices = {
  getAllDatabases,
};
