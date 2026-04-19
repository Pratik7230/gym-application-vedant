import crypto from "node:crypto";

import { ROLES } from "@/constants/roles.js";
import { requireAuth } from "@/lib/auth/session.js";
import { connectDB } from "@/lib/db.js";
import { AppError, jsonError } from "@/lib/errors.js";
import { computeCachedStatus } from "@/lib/subscription-status.js";
import Payment from "@/models/Payment.js";
import Plan from "@/models/Plan.js";
import Subscription from "@/models/Subscription.js";
import { logActivity } from "@/services/activityLogService.js";
import { createSubscription } from "@/services/subscriptionService.js";
import { sendSubscriptionReceiptEmail } from "@/services/emailService.js";
import { clientSubscriptionRazorpayVerifySchema } from "@/validators/client.js";

export const runtime = "nodejs";

function verifyRazorpaySignature(orderId, paymentId, signature) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) throw new AppError("Razorpay is not configured", 503);

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expected === signature;
}

function mapRazorpayError(error, fallbackMessage) {
  if (error instanceof AppError) return error;

  const statusCode = Number(error?.statusCode);
  const description = error?.error?.description || error?.description || error?.message;

  if (statusCode === 401) {
    return new AppError(
      "Razorpay authentication failed. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
      502
    );
  }

  if (statusCode === 400) {
    return new AppError(description || fallbackMessage, 400);
  }

  if (description) {
    return new AppError(description, 502);
  }

  return new AppError(fallbackMessage, 502);
}

export async function POST(request) {
  try {
    const { user } = await requireAuth(request, [ROLES.CLIENT]);
    const body = await request.json();
    const parsed = clientSubscriptionRazorpayVerifySchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    if (
      !verifyRazorpaySignature(
        parsed.data.razorpayOrderId,
        parsed.data.razorpayPaymentId,
        parsed.data.razorpaySignature
      )
    ) {
      throw new AppError("Invalid Razorpay signature", 400);
    }

    await connectDB();

    const existingPayment = await Payment.findOne({ providerPaymentId: parsed.data.razorpayPaymentId })
      .populate("subscription")
      .lean();

    if (existingPayment) {
      return Response.json({ payment: existingPayment, alreadyRecorded: true });
    }

    const plan = await Plan.findById(parsed.data.planId).lean();
    if (!plan || !plan.isActive) {
      throw new AppError("Plan is not available", 400);
    }

    const latestSub = await Subscription.findOne({ user: user._id }).sort({ endDate: -1 }).lean();
    if (latestSub && computeCachedStatus(latestSub.endDate) !== "expired") {
      throw new AppError("You already have an active subscription", 409);
    }

    const sub = await createSubscription({
      userId: user._id,
      planId: plan._id,
      startDate: new Date(),
      actorId: user._id,
    });

    await logActivity({
      actorId: user._id,
      action: "subscription.create",
      resource: "subscription",
      resourceId: sub._id,
      metadata: { userId: String(user._id), planId: String(plan._id), source: "client_checkout" },
    });

    const pay = await Payment.create({
      user: user._id,
      subscription: sub._id,
      amount: plan.price,
      currency: "INR",
      status: "paid",
      method: "online",
      provider: "razorpay",
      providerOrderId: parsed.data.razorpayOrderId,
      providerPaymentId: parsed.data.razorpayPaymentId,
      providerSignature: parsed.data.razorpaySignature,
      recordedBy: user._id,
      note: `Client purchased ${plan.name}`,
      paidAt: new Date(),
    });

    await logActivity({
      actorId: user._id,
      action: "payment.create",
      resource: "payment",
      resourceId: pay._id,
      metadata: {
        provider: "razorpay",
        amount: pay.amount,
        userId: String(user._id),
        planId: String(plan._id),
        source: "client_checkout",
      },
    });

    const fullPayment = await Payment.findById(pay._id)
      .populate("subscription")
      .populate("user", "name email")
      .lean();

    const fullSubscription = await Subscription.findById(sub._id).populate("plan").lean();

    if (user.email) {
      try {
        await sendSubscriptionReceiptEmail({
          to: user.email,
          name: user.name || "Member",
          planName: plan.name,
          amount: pay.amount,
          currency: pay.currency,
          startDate: fullSubscription.startDate,
          endDate: fullSubscription.endDate,
          providerPaymentId: pay.providerPaymentId,
          providerOrderId: pay.providerOrderId,
        });
      } catch (emailError) {
        console.error("[email] subscription receipt send failed", {
          userId: String(user._id),
          paymentId: pay.providerPaymentId,
          error: emailError?.message || emailError,
        });
      }
    }

    return Response.json({ payment: fullPayment, subscription: fullSubscription }, { status: 201 });
  } catch (e) {
    return jsonError(mapRazorpayError(e, "Unable to verify Razorpay payment"));
  }
}
