/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@framex/database";

const getAllDatabases = async () => {
  // If we truly migrated to Postgres, listing databases means listing schemas or using a query.
  // For now, we will just list the metadata from DatabaseInfo table.
  // Mongoose version verified physical existence.

  // We can query physical Postgres DBs if we want, using raw query.
  // But to keep it simple and safe, we rely on metadata for now, 
  // or checks "postgres" usage.

  let physicalDbs: any[] = [];
  try {
    // Optional: Check actual postgres databases/schemas
    // const result = await prisma.$queryRaw`SELECT datname FROM pg_database WHERE datistemplate = false;`;
    // physicalDbs = result as any[];
  } catch (e) {
    // ignore
  }

  // Get tenant databases info
  const dbInfo = await prisma.databaseInfo.findMany();

  // Map database info
  const databasesList = dbInfo.map((info) => {
    return {
      name: info.databaseName,
      sizeOnDisk: info.size, // stored in BigInt, convert to number or string?
      empty: false, // Placeholder
      tenantId: info.tenantId,
      createdAt: info.createdAt,
      connectionString: info.databaseUrl ? "***encrypted***" : null,
    };
  });

  return databasesList;
};

export const DatabaseServices = {
  getAllDatabases,
};
