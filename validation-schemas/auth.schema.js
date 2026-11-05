import { z } from "zod";

const passwordSchema = z
  .string({ error: "password is required" })
  .min(8, "password must be at least 8 characters")
  .regex(
    /[A-Z]/,
    "password must contain at least 1 capital letter, 1 small letter, 1 digit, and 1 special character",
  )
  .regex(
    /[a-z]/,
    "password must contain at least 1 capital letter, 1 small letter, 1 digit, and 1 special character",
  )
  .regex(
    /[0-9]/,
    "password must contain at least 1 capital letter, 1 small letter, 1 digit, and 1 special character",
  )
  .regex(
    /[^A-Za-z0-9]/,
    "password must contain at least 1 capital letter, 1 small letter, 1 digit, and 1 special character",
  );

const emailSchema = z
  .string({ error: "email is required" })
  .trim()
  .toLowerCase()
  .email("invalid email");

export const registerSchema = z
  .object({
    username: z
      .string({ error: "username is required" })
      .trim()
      .min(2, "username must be at least 2 characters"),
    email: emailSchema,
    password: passwordSchema,
    password_confirmation: z
      .string({ error: "password confirmation is required" })
      .min(1, "password confirmation is required"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "passwords do not match",
    path: ["password_confirmation"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ error: "password is required" }).min(1, "password is required"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    email: emailSchema,
    otp: z
      .string({ error: "invalid or expired otp" })
      .trim()
      .regex(/^\d{6}$/, "invalid or expired otp"),
    new_password: passwordSchema,
    new_password_confirmation: z
      .string({ error: "password confirmation is required" })
      .min(1, "password confirmation is required"),
  })
  .refine((data) => data.new_password === data.new_password_confirmation, {
    message: "passwords do not match",
    path: ["new_password_confirmation"],
  });
