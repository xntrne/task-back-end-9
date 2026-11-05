import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    number: {
      type: Number,
      required: [true, "rating is required"],
      min: [0, "rating must be between 0 and 10"],
      max: [10, "rating must be between 0 and 10"],
    },
    comment: {
      type: String,
      trim: true,
      default: "",
    },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

reviewSchema.statics.findByMovie = function (movieId) {
  return this.find({ movie: movieId })
    .populate("user", "username image")
    .sort({ createdAt: -1 });
};

reviewSchema.statics.findByUser = function (userId) {
  return this.find({ user: userId })
    .populate("movie", "title year image")
    .sort({ createdAt: -1 });
};

export const Review = mongoose.model("Review", reviewSchema);
