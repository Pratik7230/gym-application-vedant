import { put } from "@vercel/blob";
import { requireAuth } from "@/lib/auth/session.js";
import { connectDB } from "@/lib/db.js";
import User from "@/models/User.js";
import { jsonError } from "@/lib/errors.js";

export async function POST(request) {
  try {
    const { user } = await requireAuth(request);
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string" || !file.size) {
      return Response.json({ error: "Missing file" }, { status: 400 });
    }
    const max = 2 * 1024 * 1024;
    if (file.size > max) {
      return Response.json({ error: "File too large (max 2MB)" }, { status: 400 });
    }
    const type = file.type || "";
    if (!type.startsWith("image/")) {
      return Response.json({ error: "Only images allowed" }, { status: 400 });
    }

    const ext = type.split("/")[1] || "jpg";
    const pathname = `avatars/${user._id}-${Date.now()}.${ext}`;

    const blob = await put(pathname, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    await connectDB();
    await User.findByIdAndUpdate(user._id, { avatarUrl: blob.url });

    return Response.json({ url: blob.url });
  } catch (e) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return Response.json(
        { error: "BLOB_READ_WRITE_TOKEN not configured. Set it for Vercel Blob uploads." },
        { status: 503 }
      );
    }
    return jsonError(e);
  }
}
