import express from "express";
import { User } from "../models/User.js";
import { Session } from "../models/Session.js";
import { checkAuth, SESSION_COOKIE } from "../middleware/checkAuth.js";
import { validateBody } from "../middleware/validateBody.js";
import { removeUploadedFile, upload } from "../middleware/upload.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validation-schemas/auth.schema.js";

export const authRouter = express.Router();

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
  };
}

function getClearCookieOptions() {
  const options = getCookieOptions();
  delete options.maxAge;
  return options;
}

// POST /auth/register - create an account (no session yet)
authRouter.post("/register", upload.single("image"), validateBody(registerSchema), async (req, res) => {
  const { username, email, password } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    removeUploadedFile(req.file?.filename);

    return res.status(422).json({
      errors: { email: { errors: ["email already in use"] } },
    });
  }

  const user = await User.create({
    username,
    email,
    password,
    image: req.file?.filename ?? null,
  });

  res.status(201).json({
    message: "register successful, you can now login",
    data: { user },
  });
});

// POST /auth/login - verify credentials and open a session
authRouter.post("/login", validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: "invalid email or password" });
  }

  const { sessionId } = await Session.createSession(user._id);

  res.cookie(SESSION_COOKIE, sessionId, getCookieOptions());

  res.json({
    message: "login successful",
    data: { user },
  });
});

// POST /auth/logout - destroy the session and clear the cookie
authRouter.post("/logout", async (req, res) => {
  const sessionId = req.cookies?.[SESSION_COOKIE];

  await Session.destroySession(sessionId);

  res.clearCookie(SESSION_COOKIE, getClearCookieOptions());

  res.json({ message: "logout successful" });
});

// POST /auth/forgot-password - generate a 6 digit OTP valid for 15 minutes
authRouter.post("/forgot-password", validateBody(forgotPasswordSchema), async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(404).json({ error: "user with this email does not exist" });
  }

  const otp = user.createResetOtp();
  await user.save();

  res.json({ message: "otp generated successfully", otp });
});

// POST /auth/reset-password - verify the OTP and replace the password
authRouter.post("/reset-password", validateBody(resetPasswordSchema), async (req, res) => {
  const { email, otp, new_password } = req.body;

  const user = await User.findOne({ email });

  if (!user || !user.verifyResetOtp(otp)) {
    return res.status(400).json({ error: "invalid or expired otp" });
  }

  user.password = new_password;
  user.clearResetOtp();
  await user.save();

  // Any stolen session must die after a password reset.
  await Session.deleteMany({ user: user._id });

  res.json({ message: "password reset successful, you can now login" });
});

// GET /auth/me - current user from the session cookie
authRouter.get("/me", checkAuth, (req, res) => {
  res.json({ data: { user: req.user } });
});
