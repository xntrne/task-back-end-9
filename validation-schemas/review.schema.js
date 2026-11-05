import { z } from "zod";

export const createReviewSchema = z.object({
  number: z.coerce
    .number({ error: "rating is required" })
    .min(0, "rating must be between 0 and 10")
    .max(10, "rating must be between 0 and 10"),
  comment: z
    .string({ error: "comment must be a string" })
    .trim()
    .max(1000, "comment is too long")
    .optional()
    .default(""),
});

export const updateReviewSchema = z
  .object({
    number: z.coerce
      .number({ error: "rating must be a number" })
      .min(0, "rating must be between 0 and 10")
      .max(10, "rating must be between 0 and 10")
      .optional(),
    comment: z
      .string({ error: "comment must be a string" })
      .trim()
      .max(1000, "comment is too long")
      .optional(),
  })
  .refine((data) => data.number !== undefined || data.comment !== undefined, {
    message: "at least one field is required",
    path: ["body"],
  });
