import { cleanupUploadedFiles } from "./upload.js";

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  console.log("err", error);

  cleanupUploadedFiles(req);

  if (error?.name === "MulterError") {
    const message =
      error.code === "LIMIT_FILE_SIZE" ? "image must be 5MB or smaller" : error.message;

    return res.status(422).json({
      errors: { [error.field || "image"]: { errors: [message] } },
    });
  }

  if (error?.name === "ValidationError" && error.errors) {
    const errors = {};

    for (const [field, detail] of Object.entries(error.errors)) {
      errors[field] = { errors: [detail.message] };
    }

    return res.status(422).json({ errors });
  }

  if (error?.name === "CastError") {
    return res.status(400).json({ error: "invalid id" });
  }

  if (error?.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || "field";

    return res.status(422).json({
      errors: { [field]: { errors: [`${field} already in use`] } },
    });
  }

  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "invalid json body" });
  }

  if (error?.status) {
    return res.status(error.status).json({ error: error.message });
  }

  res.status(500).json({ error: "something went wrong" });
}
