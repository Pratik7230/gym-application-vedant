import Subscription from "@/models/Subscription.js";
import Plan from "@/models/Plan.js";
import { connectDB } from "@/lib/db.js";
import { computeCachedStatus } from "@/lib/subscription-status.js";
import { AppError } from "@/lib/errors.js";

export function computeEndDate(startDate, plan) {
  const d = new Date(startDate);
  d.setDate(d.getDate() + plan.durationDays);
  return d;
}

export async function createSubscription({ userId, planId, startDate, actorId }) {
  await connectDB();
  const plan = await Plan.findById(planId);
  if (!plan || !plan.isActive) throw new AppError("Invalid plan", 400);
  const start = new Date(startDate);
  const endDate = computeEndDate(start, plan);
  const cachedStatus = computeCachedStatus(endDate);
  const sub = await Subscription.create({
    user: userId,
    plan: planId,
    startDate: start,
    endDate,
    cachedStatus,
  });
  return sub;
}

export async function syncSubscriptionStatusDoc(sub) {
  const cachedStatus = computeCachedStatus(sub.endDate);
  if (sub.cachedStatus !== cachedStatus) {
    sub.cachedStatus = cachedStatus;
    await sub.save();
  }
  return sub;
}

export async function refreshAllSubscriptionStatuses() {
  await connectDB();
  const subs = await Subscription.find({});
  for (const s of subs) {
    await syncSubscriptionStatusDoc(s);
  }
}
