import mongoose from "mongoose";

const actorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    birthdate: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

actorSchema.virtual("movies", {
  ref: "Movie",
  localField: "_id",
  foreignField: "actors",
  justOne: false,
});

actorSchema.statics.searchByName = function (search = "") {
  const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filter = escaped ? { name: { $regex: escaped, $options: "i" } } : {};

  return this.find(filter).sort({ createdAt: -1 });
};

export const Actor = mongoose.model("Actor", actorSchema);
