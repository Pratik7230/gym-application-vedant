import mongoose from "mongoose";

const webhookEventSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true, enum: ["razorpay"] },
    eventId: { type: String, required: true, unique: true },
    eventType: { type: String, required: true },
    paymentId: { type: String, default: null },
    orderId: { type: String, default: null },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    processed: { type: Boolean, default: false },
    processedAt: { type: Date, default: null },
    error: { type: String, default: null },
    metadata: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription", default: null },
      amount: { type: Number, default: null },
    },
  },
  { timestamps: true }
);

webhookEventSchema.index({ provider: 1, eventId: 1 });
webhookEventSchema.index({ eventType: 1 });
webhookEventSchema.index({ processed: 1, createdAt: -1 });
webhookEventSchema.index({ paymentId: 1 }, { sparse: true });

export default mongoose.models.WebhookEvent ||
  mongoose.model("WebhookEvent", webhookEventSchema);
