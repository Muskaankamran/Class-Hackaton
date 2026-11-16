import jwt from "jsonwebtoken";
import userModel from "../models/users.model.js";

export async function authenticateToken(req, res, next) {
  const authorization = req.get("authorization");
  const token = req.cookies?.token ||
    (authorization?.startsWith("Bearer ") ? authorization.slice(7) : null);

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!process.env.JWT_SECRET) {
    return next(new Error("JWT_SECRET is not configured"));
  }
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
  const user = await userModel.findById(payload.id).select("_id role isActive");
  if (!user || user.isActive === false) {
    return res.status(401).json({ message: "Account is unavailable" });
  }
  req.user = { id: user._id.toString(), role: user.role };
  return next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
}

export const requireAdmin = requireRole("admin");
