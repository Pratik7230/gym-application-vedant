import { connectDB } from "@/lib/db";
import User from "@/models/User";
import PendingSignup from "@/models/PendingSignup";
import { ROLES } from "@/constants/roles";
import { hashPassword, verifyPassword } from "@/lib/auth/password.js";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt.js";
import { AppError } from "@/lib/errors.js";
import crypto from "crypto";
import { sendPasswordResetOtpEmail, sendSignupOtpEmail } from "@/services/emailService";

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 10);
const OTP_MAX_ATTEMPTS = 5;

function normalizeEmail(email) {
  return String(email || "").toLowerCase().trim();
}

function buildOtpHash(email, otp) {
  const secret = process.env.OTP_SECRET || process.env.JWT_ACCESS_SECRET || "dev-otp-secret";
  return crypto.createHash("sha256").update(`${normalizeEmail(email)}:${String(otp)}:${secret}`).digest("hex");
}

function createOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function otpExpiryDate() {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

async function issueTokens(user) {
  const access = await signAccessToken({
    sub: user._id.toString(),
    role: user.role,
    rv: user.refreshTokenVersion,
  });
  const refresh = await signRefreshToken({
    sub: user._id.toString(),
    rv: user.refreshTokenVersion,
  });
  return { access, refresh };
}

function toUserResponse(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function registerUser({ email, password, name, phone, role }) {
  await connectDB();
  const normalizedEmail = normalizeEmail(email);
  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) throw new AppError("Email already registered", 409);

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    email: normalizedEmail,
    passwordHash,
    name,
    phone: phone ?? "",
    role: role ?? ROLES.CLIENT,
  });

  const { access, refresh } = await issueTokens(user);

  return {
    user: toUserResponse(user),
    access,
    refresh,
  };
}

export async function requestSignupOtp({ email, password, name, phone, role }) {
  await connectDB();
  const normalizedEmail = normalizeEmail(email);
  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) throw new AppError("Email already registered", 409);

  const passwordHash = await hashPassword(password);
  const otp = createOtp();
  const otpHash = buildOtpHash(normalizedEmail, otp);
  const otpExpiresAt = otpExpiryDate();

  await PendingSignup.findOneAndUpdate(
    { email: normalizedEmail },
    {
      email: normalizedEmail,
      passwordHash,
      name,
      phone: phone ?? "",
      role: role ?? ROLES.CLIENT,
      otpHash,
      otpExpiresAt,
      otpAttempts: 0,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    await sendSignupOtpEmail({
      to: normalizedEmail,
      name,
      otp,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });
  } catch {
    await PendingSignup.deleteOne({ email: normalizedEmail });
    throw new AppError("Unable to send OTP email right now. Please try again.", 502);
  }

  return {
    email: normalizedEmail,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
  };
}

export async function completeSignupWithOtp({ email, otp }) {
  await connectDB();
  const normalizedEmail = normalizeEmail(email);
  const pending = await PendingSignup.findOne({ email: normalizedEmail });
  if (!pending) {
    throw new AppError("No signup request found for this email", 400);
  }
  if (pending.otpExpiresAt.getTime() < Date.now()) {
    await PendingSignup.deleteOne({ _id: pending._id });
    throw new AppError("OTP expired. Please request a new code", 400);
  }
  if ((pending.otpAttempts || 0) >= OTP_MAX_ATTEMPTS) {
    throw new AppError("Too many invalid OTP attempts. Please request a new code", 429);
  }

  const expectedHash = buildOtpHash(normalizedEmail, otp);
  if (pending.otpHash !== expectedHash) {
    pending.otpAttempts = (pending.otpAttempts || 0) + 1;
    await pending.save();
    throw new AppError("Invalid OTP", 400);
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    await PendingSignup.deleteOne({ _id: pending._id });
    throw new AppError("Email already registered", 409);
  }

  const user = await User.create({
    email: pending.email,
    passwordHash: pending.passwordHash,
    name: pending.name,
    phone: pending.phone ?? "",
    role: pending.role ?? ROLES.CLIENT,
  });

  await PendingSignup.deleteOne({ _id: pending._id });
  const { access, refresh } = await issueTokens(user);
  return {
    user: toUserResponse(user),
    access,
    refresh,
  };
}

export async function loginUser({ email, password }) {
  await connectDB();
  const user = await User.findOne({ email: normalizeEmail(email) });
  if (!user) throw new AppError("Invalid credentials", 401);
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new AppError("Invalid credentials", 401);
  if (!user.isActive) throw new AppError("Account disabled", 403);

  const { access, refresh } = await issueTokens(user);

  return {
    user: toUserResponse(user),
    access,
    refresh,
  };
}

export async function requestPasswordResetOtp({ email }) {
  await connectDB();
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });
  if (!user || !user.isActive) {
    return { ok: true };
  }

  const otp = createOtp();
  user.passwordResetOtpHash = buildOtpHash(normalizedEmail, otp);
  user.passwordResetOtpExpiresAt = otpExpiryDate();
  user.passwordResetOtpAttempts = 0;
  await user.save();

  try {
    await sendPasswordResetOtpEmail({
      to: normalizedEmail,
      name: user.name,
      otp,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });
  } catch {
    user.passwordResetOtpHash = null;
    user.passwordResetOtpExpiresAt = null;
    user.passwordResetOtpAttempts = 0;
    await user.save();
    throw new AppError("Unable to send OTP email right now. Please try again.", 502);
  }

  return { ok: true };
}

export async function resetPasswordWithOtp({ email, otp, newPassword }) {
  await connectDB();
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });
  if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
    throw new AppError("Invalid or expired reset request", 400);
  }
  if (user.passwordResetOtpExpiresAt.getTime() < Date.now()) {
    user.passwordResetOtpHash = null;
    user.passwordResetOtpExpiresAt = null;
    user.passwordResetOtpAttempts = 0;
    await user.save();
    throw new AppError("OTP expired. Please request a new code", 400);
  }
  if ((user.passwordResetOtpAttempts || 0) >= OTP_MAX_ATTEMPTS) {
    throw new AppError("Too many invalid OTP attempts. Please request a new code", 429);
  }

  const expectedHash = buildOtpHash(normalizedEmail, otp);
  if (user.passwordResetOtpHash !== expectedHash) {
    user.passwordResetOtpAttempts = (user.passwordResetOtpAttempts || 0) + 1;
    await user.save();
    throw new AppError("Invalid OTP", 400);
  }

  user.passwordHash = await hashPassword(newPassword);
  user.passwordResetOtpHash = null;
  user.passwordResetOtpExpiresAt = null;
  user.passwordResetOtpAttempts = 0;
  user.refreshTokenVersion = (user.refreshTokenVersion || 0) + 1;
  await user.save();

  return { ok: true };
}

export async function logoutUser(userId) {
  await connectDB();
  await User.findByIdAndUpdate(userId, { $inc: { refreshTokenVersion: 1 } });
}
