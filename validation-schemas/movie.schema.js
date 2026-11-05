import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "invalid actor id");

// Multipart forms send genres as "Action, Sci-Fi" or as a JSON array string.
function parseList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // Not JSON, fall back to comma separated values.
  }

  return trimmed
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const genresSchema = z.preprocess(
  parseList,
  z
    .array(z.string().min(1), { error: "at least one genre is required" })
    .min(1, "at least one genre is required"),
);

const actorsSchema = z.preprocess(parseList, z.array(objectIdSchema, { error: "invalid actors list" }));

const youtubeUrlSchema = z
  .string({ error: "trailerLink is required" })
  .trim()
  .url("trailerLink must be a valid YouTube URL")
  .refine(
    (value) => /(?:youtube\.com|youtu\.be)/i.test(value),
    "trailerLink must be a valid YouTube URL",
  );

export const createMovieSchema = z.object({
  title: z
    .string({ error: "title is required" })
    .trim()
    .min(1, "title is required"),
  year: z.coerce
    .number({ error: "year is required" })
    .int("year must be a whole number")
    .min(1888, "year must be 1888 or later")
    .max(2100, "year must be 2100 or earlier"),
  genres: genresSchema,
  description: z
    .string({ error: "description is required" })
    .trim()
    .min(1, "description is required"),
  trailerLink: youtubeUrlSchema,
  director: z
    .string({ error: "director is required" })
    .trim()
    .min(1, "director is required"),
  actors: actorsSchema.optional(),
});

export const updateMovieSchema = createMovieSchema.partial();
