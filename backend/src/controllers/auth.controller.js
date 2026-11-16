import userModel from "../models/users.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

function publicUser(user) {
  const result = user.toObject();
  delete result.password;
  return result;
}

function createToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );
}

function setTokenCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000,
  });
}

async function registerUser(req, res) {
  const { name, username, email, password, role } = req.body ?? {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const displayName = typeof name === "string" ? name.trim() :
    (typeof username === "string" ? username.trim() : "");
  const legacyUsername = typeof username === "string" && username.trim()
    ? username.trim()
    : normalizedEmail;

  if (role && role !== "patient") {
    return res.status(403).json({ message: "Public registration is limited to patients" });
  }
  if (username !== undefined && (typeof username !== "string" || !username.trim())) {
    return res.status(400).json({ message: "Username must be a non-empty string" });
  }
  if (!displayName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
      typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ message: "Name, valid email, and a password of at least 8 characters are required" });
  }

  const userAlreadyExists = await userModel.findOne({
    $or: [{ email: normalizedEmail }, { username: legacyUsername }],
  });
  if (userAlreadyExists) {
    return res.status(409).json({ message: "User already exists" });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await userModel.create({
    name: displayName,
    username: legacyUsername,
    email: normalizedEmail,
    password: hash,
    role: "patient",
  });
  const token = createToken(user);
  setTokenCookie(res, token);

  return res.status(201).json({
    message: "User created successfully",
    user: publicUser(user),
    token,
  });
}

async function loginUser(req, res) {
  const { email, username, password } = req.body ?? {};
  if (typeof password !== "string" || (!email && !username)) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await userModel.findOne(email
    ? { email: String(email).trim().toLowerCase() }
    : { username: String(username).trim() });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  if (user.isActive === false) {
    return res.status(403).json({ message: "This account is inactive" });
  }

  const token = createToken(user);
  setTokenCookie(res, token);
  return res.status(200).json({
    message: "User logged in successfully",
    user: publicUser(user),
    token,
  });
}

export { registerUser, loginUser };