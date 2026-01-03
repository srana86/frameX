// Database Service for Super Admin
// Gets merchant database connection strings

import { getCollection } from "./mongodb";
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "";

function decrypt(encryptedText: string): string {
  if (!ENCRYPTION_KEY) {
    return encryptedText;
  }

  try {
    const algorithm = "aes-256-cbc";
    const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
    const parts = encryptedText.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Error decrypting:", error);
    return encryptedText;
  }
}

export async function getMerchantConnectionString(merchantId: string): Promise<string | null> {
  try {
    const col = await getCollection("merchant_databases");
    const config = await col.findOne({ merchantId, status: "active" });

    if (!config || !(config as any).connectionString) {
      return null;
    }

    return decrypt((config as any).connectionString);
  } catch (error) {
    console.error("Error fetching merchant database config:", error);
    return null;
  }
}
