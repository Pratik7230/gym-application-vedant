import { connectDB } from "@/lib/db.js";
import Subscription from "@/models/Subscription.js";
import { sendSubscriptionReminderEmail } from "@/services/emailService.js";
import { remainingDays } from "@/lib/subscription-status.js";
import { refreshAllSubscriptionStatuses } from "@/services/subscriptionService.js";

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

export async function GET(request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const now = new Date();

  await refreshAllSubscriptionStatuses();

  const in3 = new Date(now);
  in3.setDate(in3.getDate() + 3);
  const ds = startOfDay(in3);
  const de = endOfDay(in3);

  const subs3 = await Subscription.find({
    endDate: { $gte: ds, $lte: de },
  })
    .populate("user")
    .populate("plan");

  let reminders = 0;
  for (const sub of subs3) {
    const u = sub.user;
    if (!u || !u.email) continue;
    if (remainingDays(sub.endDate) !== 3) continue;
    const last = sub.lastReminderSentAt;
    if (last && startOfDay(last).getTime() === startOfDay(now).getTime()) continue;

    await sendSubscriptionReminderEmail({
      to: u.email,
      name: u.name,
      endDate: sub.endDate,
      daysLeft: 3,
    });
    sub.lastReminderSentAt = now;
    await sub.save();
    reminders += 1;
  }

  const ts = startOfDay(now);
  const te = endOfDay(now);
  const expiringToday = await Subscription.find({
    endDate: { $gte: ts, $lte: te },
  }).populate("user");

  let expiryEmails = 0;
  for (const sub of expiringToday) {
    const u = sub.user;
    if (!u || !u.email) continue;
    const last = sub.expiryEmailSentAt;
    if (last && startOfDay(last).getTime() === startOfDay(now).getTime()) continue;

    await sendSubscriptionReminderEmail({
      to: u.email,
      name: u.name,
      endDate: sub.endDate,
      daysLeft: 0,
    });
    sub.expiryEmailSentAt = now;
    await sub.save();
    expiryEmails += 1;
  }

  return Response.json({ ok: true, reminders, expiryEmails });
}
