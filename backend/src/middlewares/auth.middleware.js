import jwt from "jsonwebtoken";
import User from "../models/users.model.js";

export async function authenticateToken(req, res, next) {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Authentication token is required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Invalid token: user not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account is deactivated. Please contact the administrator.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
      error: error.message,
    });
  }
}

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Requires one of: [${roles.join(", ")}]`,
      });
    }
    next();
  };
}

export const requireAdmin = authorizeRoles("admin");
export const requireDoctor = authorizeRoles("doctor");
export const requirePatient = authorizeRoles("patient");
