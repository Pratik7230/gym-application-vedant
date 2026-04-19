import crypto from "node:crypto";

import { ROLES } from "@/constants/roles.js";
import { requireAuth } from "@/lib/auth/session.js";
import { connectDB } from "@/lib/db.js";
import { AppError, jsonError } from "@/lib/errors.js";
import Payment from "@/models/Payment.js";
import User from "@/models/User.js";
import { logActivity } from "@/services/activityLogService.js";
import { razorpayVerifySchema } from "@/validators/admin.js";

export const runtime = "nodejs";

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

function verifyRazorpaySignature(orderId, paymentId, signature) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) throw new AppError("Razorpay is not configured", 503);

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expected === signature;
}

export async function POST(request) {
  try {
    const { user: actor } = await requireAuth(request, [ROLES.ADMIN]);
    const body = await request.json();
    const parsed = razorpayVerifySchema.safeParse(body);

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

    const existing = await Payment.findOne({ providerPaymentId: parsed.data.razorpayPaymentId })
      .populate("user", "name email")
      .populate("subscription")
      .populate("recordedBy", "name email")
      .lean();

    if (existing) {
      return Response.json({ payment: existing, alreadyRecorded: true });
    }

    const member = await User.findById(parsed.data.userId).lean();
    if (!member) throw new AppError("User not found", 404);

    const pay = await Payment.create({
      user: parsed.data.userId,
      subscription: parsed.data.subscriptionId || null,
      amount: parsed.data.amount,
      currency: parsed.data.currency || "INR",
      status: "paid",
      method: "online",
      provider: "razorpay",
      providerOrderId: parsed.data.razorpayOrderId,
      providerPaymentId: parsed.data.razorpayPaymentId,
      providerSignature: parsed.data.razorpaySignature,
      recordedBy: actor._id,
      note: parsed.data.note || "",
      paidAt: new Date(),
    });

    await logActivity({
      actorId: actor._id,
      action: "payment.create",
      resource: "payment",
      resourceId: pay._id,
      metadata: {
        provider: "razorpay",
        amount: pay.amount,
        userId: String(member._id),
      },
    });

    const full = await Payment.findById(pay._id)
      .populate("user", "name email")
      .populate("subscription")
      .populate("recordedBy", "name email")
      .lean();

    return Response.json({ payment: full }, { status: 201 });
  } catch (e) {
    return jsonError(mapRazorpayError(e, "Unable to verify Razorpay payment"));
  }
}
