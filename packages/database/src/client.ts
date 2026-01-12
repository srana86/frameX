import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new Error(
            "DATABASE_URL environment variable is not set. " +
            "Make sure to load environment variables (e.g., dotenv.config()) " +
            "BEFORE importing @framex/database."
        );
    }

    const adapter = new PrismaPg({
        connectionString: databaseUrl,
    });

    return new PrismaClient({
        adapter,
        log:
            process.env.NODE_ENV === "development"
                ? ["error", "warn"]
                : ["error"],
    });
};

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = prisma;
}

export default prisma;

