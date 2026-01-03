import crypto from "crypto";
import config from "../../../config/index";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Merchant-ID",
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

const uploadImage = async (
  file: any,
  url: string | null,
  folder: string,
  public_id: string | undefined,
  resource_type: string = "auto",
  merchantId: string = "unknown"
) => {
  if (!file && !url) {
    throw new Error("Provide 'file' (Blob) or 'url'");
  }

  const cloud_name = requireEnv("CLOUDINARY_CLOUD_NAME");
  const api_key = requireEnv("CLOUDINARY_API_KEY");
  const api_secret = requireEnv("CLOUDINARY_API_SECRET");

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign: Record<string, string | number> = { timestamp };
  if (folder) paramsToSign.folder = folder;
  if (public_id) paramsToSign.public_id = public_id;

  const signatureBase =
    Object.keys(paramsToSign)
      .sort()
      .map((k) => `${k}=${paramsToSign[k]}`)
      .join("&") + api_secret;

  const signature = crypto
    .createHash("sha1")
    .update(signatureBase)
    .digest("hex");

  const body = new FormData();
  body.append("api_key", api_key);
  body.append("timestamp", String(timestamp));
  body.append("signature", signature);
  if (folder) body.append("folder", folder);
  if (public_id) body.append("public_id", public_id);
  if (file && typeof file === "object" && "arrayBuffer" in file) {
    body.append("file", file as Blob);
  } else if (typeof file === "string") {
    body.append("file", file);
  } else if (typeof url === "string") {
    body.append("file", url);
  }

  const cloudUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/${resource_type}/upload`;
  const res = await fetch(cloudUrl, { method: "POST", body });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error?.message || "Upload failed");
  }

  return json;
};

const deleteImage = async (
  public_id: string,
  resource_type: string = "image",
  merchantId: string = "unknown"
) => {
  if (!public_id) {
    throw new Error("public_id is required");
  }

  const cloud_name = requireEnv("CLOUDINARY_CLOUD_NAME");
  const api_key = requireEnv("CLOUDINARY_API_KEY");
  const api_secret = requireEnv("CLOUDINARY_API_SECRET");

  const timestamp = Math.floor(Date.now() / 1000);
  const signatureBase = `public_id=${public_id}&timestamp=${timestamp}${api_secret}`;
  const signature = crypto
    .createHash("sha1")
    .update(signatureBase)
    .digest("hex");

  const formData = new FormData();
  formData.append("public_id", public_id);
  formData.append("api_key", api_key);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);

  const cloudUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/${resource_type}/destroy`;
  const res = await fetch(cloudUrl, { method: "POST", body: formData });
  const json = await res.json();

  if (!res.ok || json.result !== "ok") {
    throw new Error(json?.error?.message || "Delete failed");
  }

  return { success: true, result: json };
};

const getCloudinaryConfig = async () => {
  const cloudName =
    config.cloudinary_cloud_name || process.env.CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    throw new Error("Cloudinary not configured");
  }

  return {
    cloudName,
    baseUrl: `https://res.cloudinary.com/${cloudName}`,
  };
};

export const CloudinaryServices = {
  uploadImage,
  deleteImage,
  getCloudinaryConfig,
  corsHeaders,
};
