import express from "express";
import { createReview } from "../controllers/review.controller.js";
import { checkAuth } from "../middleware/checkAuth.js";
import { checkOwner } from "../middleware/checkOwner.js";
import { validateBody } from "../middleware/validateBody.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import { Review } from "../models/Review.js";
import { createReviewSchema, updateReviewSchema } from "../validation-schemas/review.schema.js";

export const reviewRouter = express.Router();

const checkReviewOwner = checkOwner(Review, { label: "review", ownerField: "user" });

// GET /api/reviews/my - reviews written by the current user
reviewRouter.get("/my", checkAuth, async (req, res) => {
  const reviews = await Review.findByUser(req.user._id);

  res.json({ data: reviews });
});

// POST /api/reviews/:movieId - alternative route to add a review to a movie
reviewRouter.post(
  "/:movieId",
  checkAuth,
  validateObjectId("movieId"),
  validateBody(createReviewSchema),
  createReview,
);

// PATCH /api/reviews/:id - only the author may edit their review
reviewRouter.patch(
  "/:id",
  checkAuth,
  validateObjectId(),
  checkReviewOwner,
  validateBody(updateReviewSchema),
  async (req, res) => {
    req.resource.set(req.body);
    await req.resource.save();

    res.json({
      message: "review updated successfully",
      data: req.resource,
    });
  },
);

// DELETE /api/reviews/:id - only the author may delete their review
reviewRouter.delete("/:id", checkAuth, validateObjectId(), checkReviewOwner, async (req, res) => {
  await req.resource.deleteOne();

  res.json({ message: "review deleted successfully" });
});
