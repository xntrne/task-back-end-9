import { randomBytes } from "node:crypto";
import mongoose from "mongoose";

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

const sessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

sessionSchema.statics.createSession = async function (userId) {
  const sessionId = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await this.create({ sessionId, user: userId, expiresAt });

  return { sessionId, expiresAt };
};

sessionSchema.statics.validateSession = function (sessionId) {
  if (!sessionId) return null;

  return this.findOne({
    sessionId,
    expiresAt: { $gt: new Date() },
  }).populate("user");
};

sessionSchema.statics.destroySession = function (sessionId) {
  if (!sessionId) return null;
  return this.deleteOne({ sessionId });
};

export const Session = mongoose.model("Session", sessionSchema);
