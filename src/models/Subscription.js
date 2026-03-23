import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    cachedStatus: {
      type: String,
      enum: ["active", "expired", "expiring_soon"],
      default: "active",
    },
    lastReminderSentAt: { type: Date, default: null },
    expiryEmailSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

subscriptionSchema.index({ user: 1, endDate: 1 });
subscriptionSchema.index({ endDate: 1 });

export default mongoose.models.Subscription || mongoose.model("Subscription", subscriptionSchema);
