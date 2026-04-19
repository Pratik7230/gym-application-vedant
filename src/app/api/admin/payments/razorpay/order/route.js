import Razorpay from "razorpay";

import { ROLES } from "@/constants/roles.js";
import { requireAuth } from "@/lib/auth/session.js";
import { connectDB } from "@/lib/db.js";
import { AppError, jsonError } from "@/lib/errors.js";
import User from "@/models/User.js";
import { logActivity } from "@/services/activityLogService.js";
import { razorpayOrderCreateSchema } from "@/validators/admin.js";

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

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new AppError("Razorpay is not configured", 503);
  }

  return {
    keyId,
    client: new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    }),
  };
}

export async function POST(request) {
  try {
    const { user: actor } = await requireAuth(request, [ROLES.ADMIN]);
    const body = await request.json();
    const parsed = razorpayOrderCreateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await connectDB();
    const member = await User.findById(parsed.data.userId).lean();
    if (!member) throw new AppError("User not found", 404);

    const amountInPaise = Math.round(Number(parsed.data.amount) * 100);
    if (!Number.isInteger(amountInPaise) || amountInPaise <= 0) {
      throw new AppError("Amount must be greater than 0", 400);
    }

    const { client, keyId } = getRazorpayClient();
    const order = await client.orders.create({
      amount: amountInPaise,
      currency: (parsed.data.currency || "INR").toUpperCase(),
      receipt: `admin_${Date.now()}`,
      notes: {
        userId: String(parsed.data.userId),
        subscriptionId: parsed.data.subscriptionId ? String(parsed.data.subscriptionId) : "",
      },
    });

    await logActivity({
      actorId: actor._id,
      action: "payment.order.create",
      resource: "payment",
      resourceId: String(order.id),
      metadata: {
        provider: "razorpay",
        userId: String(member._id),
        amount: parsed.data.amount,
      },
    });

    return Response.json({
      keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      customer: {
        name: member.name || "",
        email: member.email || "",
        phone: member.phone || "",
      },
    });
  } catch (e) {
    return jsonError(mapRazorpayError(e, "Unable to create Razorpay order"));
  }
}
