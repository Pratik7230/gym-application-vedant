import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription", default: null },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "Rupees" },
    status: { type: String, enum: ["paid", "pending"], default: "paid" },
    method: { type: String, enum: ["manual", "online"], default: "manual" },
    provider: { type: String, default: "manual" },
    providerOrderId: { type: String, default: null },
    providerPaymentId: { type: String, default: null },
    providerSignature: { type: String, default: null },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: String, default: "" },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ providerPaymentId: 1 }, { unique: true, sparse: true });

export default mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
