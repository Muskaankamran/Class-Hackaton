import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/users.model.js";

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET || "clinic_jwt_secret_fallback_key",
    { expiresIn: "7d" }
  );
};

export async function registerUser(req, res) {
  try {
    const { name, username, email, password, role, specialization, experience, avatar } = req.body;

    const displayName = name || username;

    if (!displayName || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "A user with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRole = role && ["admin", "doctor", "patient"].includes(role) ? role : "patient";

    const newUser = await User.create({
      name: displayName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: userRole,
      specialization: userRole === "doctor" ? specialization || "General Medicine" : "",
      experience: userRole === "doctor" ? Number(experience) || 0 : 0,
      avatar: avatar || "",
      isActive: true,
    });

    const token = generateToken(newUser);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const safeUser = newUser.toObject();
    delete safeUser.password;

    return res.status(201).json({
      message: "Registration successful",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

export async function loginUser(req, res) {
  try {
    const { email, username, password } = req.body;
    const identifier = (email || username || "").toLowerCase().trim();

    if (!identifier || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: identifier });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account is deactivated. Please contact the clinic administrator.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.status(200).json({
      message: "Login successful",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

export async function getCurrentUser(req, res) {
  try {
    return res.status(200).json({
      user: req.user,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function logoutUser(req, res) {
  try {
    res.clearCookie("token");
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}
