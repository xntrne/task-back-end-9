import express from "express";
import { createReview } from "../controllers/review.controller.js";
import { checkAuth } from "../middleware/checkAuth.js";
import { checkOwner } from "../middleware/checkOwner.js";
import { removeUploadedFile, upload } from "../middleware/upload.js";
import { validateBody } from "../middleware/validateBody.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import { Movie } from "../models/Movie.js";
import { createMovieSchema, updateMovieSchema } from "../validation-schemas/movie.schema.js";
import { createReviewSchema } from "../validation-schemas/review.schema.js";

export const movieRouter = express.Router();

const checkMovieOwner = checkOwner(Movie, { label: "movie", ownerField: "createdBy" });

// GET /api/movies - list movies, optionally filtered by title and actor
movieRouter.get("/", async (req, res) => {
  const movies = await Movie.searchMovies({
    search: String(req.query.search ?? ""),
    actor: String(req.query.actor ?? ""),
  });

  res.json({ data: movies });
});

// GET /api/movies/:id - one movie with its cast and populated reviews
movieRouter.get("/:id", validateObjectId(), async (req, res) => {
  const movie = await Movie.findById(req.params.id)
    .populate("actors")
    .populate({
      path: "reviews",
      options: { sort: { createdAt: -1 } },
      populate: { path: "user", select: "username image" },
    });

  if (!movie) {
    return res.status(404).json({ error: "movie not found" });
  }

  res.json({ data: movie });
});

// POST /api/movies - authenticated users can add a movie (they become its owner)
movieRouter.post(
  "/",
  checkAuth,
  upload.single("image"),
  validateBody(createMovieSchema),
  async (req, res) => {
    const movie = await Movie.create({
      ...req.body,
      actors: req.body.actors ?? [],
      image: req.file?.filename ?? null,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "movie created successfully",
      data: movie,
    });
  },
);

// PATCH /api/movies/:id - only the creator may update details, poster or cast list
movieRouter.patch(
  "/:id",
  checkAuth,
  validateObjectId(),
  checkMovieOwner,
  upload.single("image"),
  validateBody(updateMovieSchema),
  async (req, res) => {
    const movie = req.resource;
    const oldImage = movie.image;

    movie.set(req.body);

    if (req.file) {
      movie.image = req.file.filename;
    }

    await movie.save();

    if (req.file && oldImage) {
      removeUploadedFile(oldImage);
    }

    res.json({
      message: "movie updated successfully",
      data: movie,
    });
  },
);

// DELETE /api/movies/:id - only the creator may delete; cascades to its reviews
movieRouter.delete("/:id", checkAuth, validateObjectId(), checkMovieOwner, async (req, res) => {
  // findByIdAndDelete (not deleteOne) so the cascade hook in models/Movie.js fires.
  const movie = await Movie.findByIdAndDelete(req.params.id);

  removeUploadedFile(movie?.image);

  res.json({ message: "movie deleted successfully" });
});

// POST /api/movies/:id/reviews - add a review as the current user
movieRouter.post(
  "/:id/reviews",
  checkAuth,
  validateObjectId(),
  validateBody(createReviewSchema),
  createReview,
);
