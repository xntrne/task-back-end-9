import mongoose from "mongoose";
import { Review } from "./Review.js";

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "title is required"],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, "year is required"],
      min: [1888, "year must be 1888 or later"],
      max: [2100, "year must be 2100 or earlier"],
    },
    genres: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      required: [true, "description is required"],
      trim: true,
    },
    trailerLink: {
      type: String,
      required: [true, "trailerLink is required"],
      trim: true,
    },
    image: {
      type: String,
      default: null,
    },
    director: {
      type: String,
      required: [true, "director is required"],
      trim: true,
    },
    actors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Actor",
      },
    ],
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

//Community reviews
movieSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "movie",
  justOne: false,
});

movieSchema.statics.searchMovies = function ({ search = "", actor = "" } = {}) {
  const filter = {};

  if (search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.title = { $regex: escaped, $options: "i" };
  }

  if (actor && mongoose.isValidObjectId(actor)) {
    filter.actors = actor;
  }

  return this.find(filter).populate("actors").sort({ createdAt: -1 });
};

//deleting a movie removes all of its reviews.
movieSchema.pre("findOneAndDelete", async function () {
  const movie = await this.model.findOne(this.getFilter());

  if (movie) {
    await Review.deleteMany({ movie: movie._id });
  }
});

export const Movie = mongoose.model("Movie", movieSchema);
