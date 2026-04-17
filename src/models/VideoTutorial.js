import mongoose from "mongoose";

const videoTutorialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    youtubeUrl: { type: String, required: true, trim: true },
    youtubeId: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

videoTutorialSchema.index({ isActive: 1, sortOrder: 1, createdAt: -1 });

export default mongoose.models.VideoTutorial || mongoose.model("VideoTutorial", videoTutorialSchema);
