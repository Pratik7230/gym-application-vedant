import mongoose from "mongoose";
import { ROLES } from "@/constants/roles";

const pendingSignupSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    role: {
      type: String,
      enum: [ROLES.ADMIN, ROLES.TRAINER, ROLES.CLIENT],
      default: ROLES.CLIENT,
    },
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    otpAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-clean stale pending signup records.
pendingSignupSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

export default mongoose.models.PendingSignup || mongoose.model("PendingSignup", pendingSignupSchema);