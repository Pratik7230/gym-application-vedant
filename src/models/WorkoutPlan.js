import mongoose from "mongoose";

const workoutItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sets: { type: Number, default: 0 },
    reps: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const workoutPlanSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    items: [workoutItemSchema],
    progressNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

workoutPlanSchema.index({ client: 1, trainer: 1 });

export default mongoose.models.WorkoutPlan || mongoose.model("WorkoutPlan", workoutPlanSchema);
