import ActivityLog from "@/models/ActivityLog.js";
import { connectDB } from "@/lib/db.js";

export async function logActivity({ actorId, action, resource, resourceId, metadata }) {
  await connectDB();
  await ActivityLog.create({
    actor: actorId,
    action,
    resource,
    resourceId: resourceId ? String(resourceId) : "",
    metadata: metadata ?? {},
  });
}
