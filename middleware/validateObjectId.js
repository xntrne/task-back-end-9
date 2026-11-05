import mongoose from "mongoose";

// Reusable :id / :movieId guard so routes never receive a malformed ObjectId.
export function validateObjectId(param = "id") {
  return (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params[param])) {
      return res.status(400).json({ error: "invalid id" });
    }

    next();
  };
}
