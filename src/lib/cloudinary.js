import crypto from "node:crypto";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

export function getCloudinaryConfig() {
  return {
    cloudName: requiredEnv("CLOUDINARY_CLOUD_NAME"),
    apiKey: requiredEnv("CLOUDINARY_API_KEY"),
    apiSecret: requiredEnv("CLOUDINARY_API_SECRET"),
  };
}

export async function uploadImageToCloudinary(file, { folder = "avatars", publicId } = {}) {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);

  const params = {
    folder,
    timestamp: String(timestamp),
  };

  if (publicId) params.public_id = publicId;

  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  const signature = crypto.createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", apiKey);
  body.append("timestamp", String(timestamp));
  body.append("signature", signature);
  body.append("folder", folder);
  if (publicId) body.append("public_id", publicId);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body,
  });

  const data = await res.json();
  if (!res.ok) {
    const message = data?.error?.message || "Cloudinary upload failed";
    throw new Error(message);
  }

  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
}