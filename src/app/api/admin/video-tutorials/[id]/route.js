import { connectDB } from "@/lib/db.js";
import { AppError, jsonError } from "@/lib/errors.js";
import { requireAuth } from "@/lib/auth/session.js";
import { ROLES } from "@/constants/roles.js";
import { logActivity } from "@/services/activityLogService.js";
import VideoTutorial from "@/models/VideoTutorial.js";
import { videoTutorialUpdateSchema } from "@/validators/admin.js";

function parseYouTubeId(urlString) {
  try {
    const url = new URL(urlString);

    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }

    if (url.hostname.includes("youtube.com")) {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v") || null;
      }
      if (url.pathname.startsWith("/shorts/")) {
        return url.pathname.split("/").filter(Boolean)[1] || null;
      }
      if (url.pathname.startsWith("/embed/")) {
        return url.pathname.split("/").filter(Boolean)[1] || null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export async function PATCH(request, { params }) {
  try {
    const { user: actor } = await requireAuth(request, [ROLES.ADMIN]);
    const id = (await params).id;
    const body = await request.json();
    const parsed = videoTutorialUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    if (!Object.keys(parsed.data).length) {
      throw new AppError("No fields provided", 400);
    }

    await connectDB();
    const item = await VideoTutorial.findById(id);
    if (!item) throw new AppError("Not found", 404);

    if (parsed.data.youtubeUrl) {
      const youtubeId = parseYouTubeId(parsed.data.youtubeUrl);
      if (!youtubeId) throw new AppError("Please provide a valid YouTube URL", 400);
      parsed.data.youtubeId = youtubeId;
    }

    Object.assign(item, parsed.data);
    await item.save();

    await logActivity({
      actorId: actor._id,
      action: "video_tutorial.update",
      resource: "video_tutorial",
      resourceId: item._id,
      metadata: parsed.data,
    });

    return Response.json({ item });
  } catch (e) {
    return jsonError(e);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user: actor } = await requireAuth(request, [ROLES.ADMIN]);
    const id = (await params).id;

    await connectDB();
    const item = await VideoTutorial.findById(id);
    if (!item) throw new AppError("Not found", 404);

    await item.deleteOne();

    await logActivity({
      actorId: actor._id,
      action: "video_tutorial.delete",
      resource: "video_tutorial",
      resourceId: id,
      metadata: { title: item.title, youtubeId: item.youtubeId },
    });

    return Response.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
