import { Movie } from "../models/Movie.js";
import { Review } from "../models/Review.js";

// Shared by POST /api/movies/:id/reviews and POST /api/reviews/:movieId
export async function createReview(req, res) {
  const movieId = req.params.movieId ?? req.params.id;
  const movie = await Movie.findById(movieId);

  if (!movie) {
    return res.status(404).json({ error: "movie not found" });
  }

  const review = await Review.create({
    number: req.body.number,
    comment: req.body.comment ?? "",
    movie: movie._id,
    user: req.user._id,
  });

  res.status(201).json({
    message: "review added successfully",
    data: review,
  });
}
