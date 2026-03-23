import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { ROLES } from "@/constants/roles";
import { hashPassword, verifyPassword } from "@/lib/auth/password.js";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt.js";
import { AppError } from "@/lib/errors.js";

export async function registerUser({ email, password, name, phone, role }) {
  await connectDB();
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new AppError("Email already registered", 409);

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash,
    name,
    phone: phone ?? "",
    role: role ?? ROLES.CLIENT,
  });

  const access = await signAccessToken({
    sub: user._id.toString(),
    role: user.role,
    rv: user.refreshTokenVersion,
  });
  const refresh = await signRefreshToken({
    sub: user._id.toString(),
    rv: user.refreshTokenVersion,
  });

  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    },
    access,
    refresh,
  };
}

export async function loginUser({ email, password }) {
  await connectDB();
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new AppError("Invalid credentials", 401);
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new AppError("Invalid credentials", 401);
  if (!user.isActive) throw new AppError("Account disabled", 403);

  const access = await signAccessToken({
    sub: user._id.toString(),
    role: user.role,
    rv: user.refreshTokenVersion,
  });
  const refresh = await signRefreshToken({
    sub: user._id.toString(),
    rv: user.refreshTokenVersion,
  });

  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    },
    access,
    refresh,
  };
}

export async function logoutUser(userId) {
  await connectDB();
  await User.findByIdAndUpdate(userId, { $inc: { refreshTokenVersion: 1 } });
}
