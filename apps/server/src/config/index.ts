import dotenv from "dotenv";
dotenv.config();

export default {
  port: process.env.PORT || 5000,
  database_url: process.env.MONGODB_URI || process.env.database_url,
  mongodb_db: process.env.MONGODB_DB || "shoestore_main",
  NODE_ENV: process.env.NODE_ENV || "development",
  // Cloudinary
  cloudinary_cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME || process.env.cloudinary_cloud_name,
  cloudinary_api_key:
    process.env.CLOUDINARY_API_KEY || process.env.cloudinary_api_key,
  cloudinary_api_secret:
    process.env.CLOUDINARY_API_SECRET || process.env.cloudinary_api_secret,
  // SSLCommerz
  sslcommerz_store_id: process.env.SSLCOMMERZ_STORE_ID,
  sslcommerz_store_password: process.env.SSLCOMMERZ_STORE_PASSWORD,
  sslcommerz_is_live: process.env.SSLCOMMERZ_IS_LIVE === "true",
  // Vercel
  vercel_token: process.env.VERCEL_TOKEN,
  vercel_team_id: process.env.VERCEL_TEAM_ID,
  github_repo: process.env.GITHUB_REPO,
  base_domain: process.env.BASE_DOMAIN,
  // FraudShield
  fraudshield_api_key: process.env.FRAUDSHIELD_API_KEY,
  fraudshield_api_base_url:
    process.env.FRAUDSHIELD_API_BASE_URL || "https://fraudshieldbd.site",
  // Base URL
  base_url:
    process.env.BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:5000",
  super_admin_url:
    process.env.SUPER_ADMIN_URL || process.env.NEXT_PUBLIC_SUPER_ADMIN_URL,
  // Security
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  encryption_key: process.env.ENCRYPTION_KEY,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS || 12,
  redis_url: process.env.REDIS_URL,
  redis_host: process.env.REDIS_HOST,
  redis_port: process.env.REDIS_PORT,
  redis_password: process.env.REDIS_PASSWORD,
  socket_path: process.env.SOCKET_PATH || "/socket.io",
  socket_ping_timeout: process.env.SOCKET_PING_TIMEOUT
    ? parseInt(process.env.SOCKET_PING_TIMEOUT)
    : 60000,
  socket_ping_interval: process.env.SOCKET_PING_INTERVAL
    ? parseInt(process.env.SOCKET_PING_INTERVAL)
    : 25000,
  frontend_url: process.env.FRONTEND_URL || "http://localhost:3000",
};
