import crypto from "node:crypto";

import { connectDB } from "@/lib/db.js";
import { AppError, jsonError } from "@/lib/errors.js";
import Payment from "@/models/Payment.js";
import WebhookEvent from "@/models/WebhookEvent.js";
import { logActivity } from "@/services/activityLogService.js";

export const runtime = "nodejs";

/**
 * Verify Razorpay webhook signature
 * @param {string} body - Raw request body
 * @param {string} signature - Razorpay signature from header
 * @returns {boolean}
 */
function verifyWebhookSignature(body, signature) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new AppError("Razorpay webhook secret is not configured", 503);
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
}

/**
 * Handle payment.authorized event
 */
async function handlePaymentAuthorized(payload) {
  const payment = payload.payment;
  const orderId = payment.order_id;
  const paymentId = payment.id;

  // Extract notes from order
  const notes = payment.notes || {};
  const userId = notes.userId;

  return {
    paymentId,
    orderId,
    status: "authorized",
    userId,
    subscriptionId: notes.subscriptionId || null,
    amount: payment.amount / 100, // Convert paise to rupees
  };
}

/**
 * Handle payment.captured event
 */
async function handlePaymentCaptured(payload) {
  const payment = payload.payment;
  const orderId = payment.order_id;
  const paymentId = payment.id;
  const notes = payment.notes || {};
  const userId = notes.userId;

  // Update or create Payment record
  const existingPayment = await Payment.findOne({ providerPaymentId: paymentId });

  if (existingPayment) {
    existingPayment.status = "paid";
    existingPayment.paidAt = new Date();
    await existingPayment.save();
  } else {
    // If manual recording wasn't done, create it from webhook
    const paymentDoc = new Payment({
      user: userId,
      subscription: notes.subscriptionId || null,
      amount: payment.amount / 100,
      currency: payment.currency || "INR",
      status: "paid",
      method: "online",
      provider: "razorpay",
      providerOrderId: orderId,
      providerPaymentId: paymentId,
      recordedBy: null, // Webhook recorded, no admin
      note: "Recorded from webhook",
      paidAt: new Date(),
    });
    await paymentDoc.save();
  }

  return {
    paymentId,
    orderId,
    status: "captured",
    userId,
    subscriptionId: notes.subscriptionId || null,
    amount: payment.amount / 100,
  };
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(payload) {
  const payment = payload.payment;
  const orderId = payment.order_id;
  const paymentId = payment.id;
  const notes = payment.notes || {};
  const userId = notes.userId;

  // Log activity for failed payment
  if (userId) {
    await logActivity({
      actorId: null,
      action: "payment.failed",
      resource: "payment",
      resourceId: paymentId,
      metadata: {
        provider: "razorpay",
        reason: payment.error_reason || "Unknown",
        userId,
      },
    });
  }

  return {
    paymentId,
    orderId,
    status: "failed",
    userId,
    reason: payment.error_reason || "Unknown",
  };
}

/**
 * Handle payment.dispute.created event
 */
async function handleDisputeCreated(payload) {
  const dispute = payload.dispute;
  const paymentId = dispute.payment_id;

  // Update payment status to dispute
  await Payment.updateOne(
    { providerPaymentId: paymentId },
    { status: "disputed", updatedAt: new Date() }
  );

  return {
    paymentId,
    disputeId: dispute.id,
    status: "dispute_created",
    reason: dispute.reason_code || "Unknown",
  };
}

/**
 * Process webhook event
 */
async function processEvent(event) {
  const eventType = event.event;
  let result = null;

  switch (eventType) {
    case "payment.authorized":
      result = await handlePaymentAuthorized(event.payload);
      break;

    case "payment.captured":
      result = await handlePaymentCaptured(event.payload);
      break;

    case "payment.failed":
      result = await handlePaymentFailed(event.payload);
      break;

    case "payment.dispute.created":
      result = await handleDisputeCreated(event.payload);
      break;

    // Add more event types as needed
    default:
      return null; // Unhandled event type
  }

  return result;
}

export async function POST(request) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get("X-Razorpay-Signature");

    if (!signature) {
      throw new AppError("Missing Razorpay signature header", 400);
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      throw new AppError("Invalid webhook signature", 400);
    }

    // Parse JSON body
    const event = JSON.parse(body);

    await connectDB();

    // Check if event already processed
    const existing = await WebhookEvent.findOne({
      eventId: event.id,
      provider: "razorpay",
    });

    if (existing) {
      // Idempotent: return success for duplicate
      return Response.json(
        { message: "Event already processed", eventId: event.id },
        { status: 200 }
      );
    }

    // Create webhook event record
    const webhookEvent = new WebhookEvent({
      provider: "razorpay",
      eventId: event.id,
      eventType: event.event,
      paymentId: event.payload?.payment?.id || null,
      orderId: event.payload?.payment?.order_id || null,
      payload: event.payload,
      metadata: {
        userId: event.payload?.payment?.notes?.userId || null,
        subscriptionId: event.payload?.payment?.notes?.subscriptionId || null,
        amount: event.payload?.payment?.amount ? event.payload.payment.amount / 100 : null,
      },
    });

    // Process the event
    try {
      const result = await processEvent(event);

      if (result) {
        webhookEvent.processed = true;
        webhookEvent.processedAt = new Date();
      }

      await webhookEvent.save();

      return Response.json(
        {
          message: "Webhook processed",
          eventId: event.id,
          eventType: event.event,
          result,
        },
        { status: 200 }
      );
    } catch (processError) {
      webhookEvent.error = processError.message;
      webhookEvent.processed = false;
      await webhookEvent.save();

      // Log the error but still return 200 to prevent Razorpay retry
      console.error("Error processing webhook event:", processError);

      return Response.json(
        {
          message: "Webhook received but processing failed",
          eventId: event.id,
          error: processError.message,
        },
        { status: 200 } // Return 200 to prevent Razorpay retries
      );
    }
  } catch (e) {
    console.error("Webhook error:", e);

    // Return appropriate error response
    if (e instanceof AppError) {
      return jsonError(e);
    }

    return jsonError(new AppError("Webhook processing failed", 500));
  }
}
