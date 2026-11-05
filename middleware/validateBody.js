import { cleanupUploadedFiles } from "./upload.js";

// Turns Zod issues into the { field: { errors: [] } } shape used by the frontend.
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      cleanupUploadedFiles(req);

      const errors = {};

      for (const issue of result.error.issues) {
        const field = issue.path[0] || "body";

        if (!errors[field]) errors[field] = { errors: [] };
        errors[field].errors.push(issue.message);
      }

      return res.status(422).json({ errors });
    }

    req.body = result.data;
    next();
  };
}
