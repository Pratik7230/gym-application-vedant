import mongoose from "mongoose";
import { ROLES } from "@/constants/roles";

const userSchema = new mongoose.Schema(
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
    avatarUrl: { type: String, default: "" },
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isActive: { type: Boolean, default: true },
    refreshTokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.index({ name: "text", email: "text" });

export default mongoose.models.User || mongoose.model("User", userSchema);
