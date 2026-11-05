import { randomInt } from "node:crypto";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "username is required"],
      trim: true,
      minlength: [2, "username must be at least 2 characters"],
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "password is required"],
      select: false,
    },
    image: {
      type: String,
      default: null,
    },
    resetOtp: {
      type: String,
      default: null,
    },
    resetOtpExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Hash the password only when it changed so profile updates do not re-hash it.
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

userSchema.methods.createResetOtp = function () {
  const otp = String(randomInt(100000, 1000000));

  this.resetOtp = otp;
  this.resetOtpExpires = new Date(Date.now() + 15 * 60 * 1000);

  return otp;
};

userSchema.methods.verifyResetOtp = function (otp) {
  if (!this.resetOtp || !this.resetOtpExpires) return false;
  if (this.resetOtpExpires.getTime() < Date.now()) return false;
  return this.resetOtp === otp;
};

userSchema.methods.clearResetOtp = function () {
  this.resetOtp = null;
  this.resetOtpExpires = null;
};

// Never leak credentials or reset codes to the client.
userSchema.set("toJSON", {
  transform: (_document, returnedObject) => {
    delete returnedObject.password;
    delete returnedObject.resetOtp;
    delete returnedObject.resetOtpExpires;
    delete returnedObject.__v;
    return returnedObject;
  },
});

export const User = mongoose.model("User", userSchema);
