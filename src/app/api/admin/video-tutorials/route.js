import { connectDB } from "@/lib/db.js";
import { AppError, jsonError } from "@/lib/errors.js";
import { requireAuth } from "@/lib/auth/session.js";
import { ROLES } from "@/constants/roles.js";
import { logActivity } from "@/services/activityLogService.js";
import VideoTutorial from "@/models/VideoTutorial.js";
import { videoTutorialCreateSchema } from "@/validators/admin.js";

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

export async function GET(request) {
  try {
    await requireAuth(request, [ROLES.ADMIN]);
    await connectDB();
    const items = await VideoTutorial.find({})
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
    return Response.json({ items });
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(request) {
  try {
    const { user: actor } = await requireAuth(request, [ROLES.ADMIN]);
    const body = await request.json();
    const parsed = videoTutorialCreateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const youtubeId = parseYouTubeId(parsed.data.youtubeUrl);
    if (!youtubeId) throw new AppError("Please provide a valid YouTube URL", 400);

    await connectDB();
    const created = await VideoTutorial.create({
      title: parsed.data.title,
      youtubeUrl: parsed.data.youtubeUrl,
      youtubeId,
      description: parsed.data.description ?? "",
      sortOrder: parsed.data.sortOrder ?? 0,
      isActive: parsed.data.isActive ?? true,
    });

    await logActivity({
      actorId: actor._id,
      action: "video_tutorial.create",
      resource: "video_tutorial",
      resourceId: created._id,
      metadata: { title: created.title, youtubeId: created.youtubeId },
    });

    return Response.json({ item: created }, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
