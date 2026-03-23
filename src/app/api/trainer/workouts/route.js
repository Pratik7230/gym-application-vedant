import { connectDB } from "@/lib/db.js";
import User from "@/models/User.js";
import WorkoutPlan from "@/models/WorkoutPlan.js";
import { requireAuth } from "@/lib/auth/session.js";
import { ROLES } from "@/constants/roles.js";
import { workoutPlanSchema } from "@/validators/client.js";
import { jsonError, AppError } from "@/lib/errors.js";

export async function GET(request) {
  try {
    const { user } = await requireAuth(request, [ROLES.TRAINER]);
    await connectDB();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const filter = { trainer: user._id };
    if (clientId) filter.client = clientId;
    const items = await WorkoutPlan.find(filter)
      .populate("client", "name email")
      .sort({ updatedAt: -1 })
      .lean();
    return Response.json({ items });
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(request) {
  try {
    const { user } = await requireAuth(request, [ROLES.TRAINER]);
    const body = await request.json();
    const parsed = workoutPlanSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    await connectDB();
    const client = await User.findById(parsed.data.clientId);
    if (!client || client.role !== ROLES.CLIENT) throw new AppError("Invalid client", 400);
    if (!client.trainer || String(client.trainer) !== String(user._id)) {
      throw new AppError("Client is not assigned to you", 403);
    }
    const plan = await WorkoutPlan.create({
      client: client._id,
      trainer: user._id,
      title: parsed.data.title,
      items: parsed.data.items,
      progressNotes: parsed.data.progressNotes ?? "",
    });
    const full = await WorkoutPlan.findById(plan._id).populate("client", "name email").lean();
    return Response.json({ workout: full }, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
