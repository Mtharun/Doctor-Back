import bcrypt from "bcryptjs";
import { UserModel } from "../models/user.model.js";
import { signToken } from "../utils/jwt.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

// Never send the passwordHash to the client.
function toPublicUser(user) {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, age, medicalHistory } = req.body;

  const existing = UserModel.findByEmail(email);
  if (existing) {
    throw new ApiError(409, "An account with that email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = UserModel.create({
    name,
    email,
    passwordHash,
    phone,
    age: age ? Number(age) : null,
    medicalHistory: medicalHistory || null,
    role: "patient", // signups are always patients; admins are seeded/promoted directly
  });

  const token = signToken({ sub: user.id, role: user.role });
  res.status(201).json({ success: true, token, user: toPublicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = UserModel.findByEmail(email);
  // Same generic message whether the email or password is wrong, so an
  // attacker can't use this endpoint to discover which emails are registered.
  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const token = signToken({ sub: user.id, role: user.role });
  res.json({ success: true, token, user: toPublicUser(user) });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: toPublicUser(req.user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, age, medicalHistory } = req.body;

  const user = UserModel.update(req.user.id, {
    name,
    phone,
    age: age !== undefined ? (age ? Number(age) : null) : undefined,
    medicalHistory,
  });

  res.json({ success: true, user: toPublicUser(user) });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const valid = await bcrypt.compare(currentPassword, req.user.passwordHash);
  if (!valid) {
    throw new ApiError(401, "Current password is incorrect.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  UserModel.update(req.user.id, { passwordHash });

  res.json({ success: true, message: "Password updated." });
});
