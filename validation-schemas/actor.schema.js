import { z } from "zod";

const birthdateSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.date("invalid birthdate").optional(),
);

export const createActorSchema = z.object({
  name: z
    .string({ error: "name is required" })
    .trim()
    .min(1, "name is required"),
  birthdate: birthdateSchema,
});

export const updateActorSchema = createActorSchema.partial();
