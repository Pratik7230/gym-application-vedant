import { connectDB } from "@/lib/db.js";
import Subscription from "@/models/Subscription.js";
import { sendSubscriptionReminderEmail } from "@/services/emailService.js";
import { remainingDays } from "@/lib/subscription-status.js";
import { refreshAllSubscriptionStatuses } from "@/services/subscriptionService.js";
import { ErrorCodes } from "@/lib/errors.js";

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function cronAuthorized(request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  const vercelCron = request.headers.get("x-vercel-cron");
  /** Vercel injects this header for scheduled invocations; VERCEL=1 on deployed builds */
  const isVercelScheduled =
    process.env.VERCEL === "1" && vercelCron === "1";

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, reason: "missing_secret" };
    }
    console.warn("[cron] CRON_SECRET is unset; allowing job in non-production only (set CRON_SECRET for real deployments).");
    return { ok: true };
  }
  if (auth === `Bearer ${secret}`) return { ok: true };
  if (isVercelScheduled) return { ok: true };
  return { ok: false, reason: "unauthorized" };
}

export async function GET(request) {
  const gate = cronAuthorized(request);
  if (!gate.ok) {
    if (gate.reason === "missing_secret") {
      return Response.json(
        { error: "Cron not configured", code: ErrorCodes.SERVER_CONFIG },
        { status: 503 }
      );
    }
    return Response.json({ error: "Unauthorized", code: ErrorCodes.UNAUTHORIZED }, { status: 401 });
  }

  const errors = [];
  let reminders = 0;
  let expiryEmails = 0;

  try {
    await connectDB();
    const now = new Date();

    await refreshAllSubscriptionStatuses();

    const in3 = new Date(now);
    in3.setDate(in3.getDate() + 3);
    const ds = startOfDay(in3);
    const de = endOfDay(in3);

    const subs3 = await Subscription.find({
      endDate: { $gte: ds, $lte: de },
      cachedStatus: { $in: ["active", "expiring_soon"] },
    })
      .populate("user")
      .populate("plan");

    for (const sub of subs3) {
      const u = sub.user;
      if (!u || !u.email) continue;
      if (remainingDays(sub.endDate) !== 3) continue;
      const last = sub.lastReminderSentAt;
      if (last && startOfDay(last).getTime() === startOfDay(now).getTime()) continue;

      try {
        const result = await sendSubscriptionReminderEmail({
          to: u.email,
          name: u.name,
          endDate: sub.endDate,
          daysLeft: 3,
        });
        if (result.skipped) continue;
        sub.lastReminderSentAt = now;
        await sub.save();
        reminders += 1;
      } catch (e) {
        console.error("[cron] 3-day reminder failed", u.email, e);
        errors.push({ type: "reminder_3d", email: u.email, message: String(e?.message || e) });
      }
    }

    const ts = startOfDay(now);
    const te = endOfDay(now);
    const expiringToday = await Subscription.find({
      endDate: { $gte: ts, $lte: te },
      cachedStatus: { $in: ["active", "expiring_soon"] },
    }).populate("user");

    for (const sub of expiringToday) {
      const u = sub.user;
      if (!u || !u.email) continue;
      if (remainingDays(sub.endDate) !== 0) continue;
      const last = sub.expiryEmailSentAt;
      if (last && startOfDay(last).getTime() === startOfDay(now).getTime()) continue;

      try {
        const result = await sendSubscriptionReminderEmail({
          to: u.email,
          name: u.name,
          endDate: sub.endDate,
          daysLeft: 0,
        });
        if (result.skipped) continue;
        sub.expiryEmailSentAt = now;
        await sub.save();
        expiryEmails += 1;
      } catch (e) {
        console.error("[cron] expiry email failed", u.email, e);
        errors.push({ type: "expiry_today", email: u.email, message: String(e?.message || e) });
      }
    }

    return Response.json({
      ok: true,
      reminders,
      expiryEmails,
      errors: errors.length ? errors : undefined,
    });
  } catch (e) {
    console.error("[cron] subscription-reminders fatal", e);
    return Response.json(
      { ok: false, error: "Job failed", code: "CRON_FAILED", details: String(e?.message || e) },
      { status: 500 }
    );
  }
}
