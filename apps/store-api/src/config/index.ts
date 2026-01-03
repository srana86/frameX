import dotenv from "dotenv";
dotenv.config();

export default {
  NODE_ENV: process.env.NODE_ENV,
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
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
