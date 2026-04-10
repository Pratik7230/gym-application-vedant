import { requireAuth } from "@/lib/auth/session.js";
import { connectDB } from "@/lib/db.js";
import User from "@/models/User.js";
import { jsonError } from "@/lib/errors.js";
import { uploadImageToCloudinary } from "@/lib/cloudinary.js";

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

    const uploaded = await uploadImageToCloudinary(file, {
      folder: "gym-application/avatars",
      publicId: String(user._id),
    });

    await connectDB();
    await User.findByIdAndUpdate(user._id, {
      avatarUrl: uploaded.url,
      avatarPublicId: uploaded.publicId,
    });

    return Response.json({ url: uploaded.url });
  } catch (e) {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return Response.json(
        {
          error:
            "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
        },
        { status: 503 }
      );
    }
    return jsonError(e);
  }
}
