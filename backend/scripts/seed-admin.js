import "dotenv/config";
import bcrypt from "bcryptjs";
import connectDB from "../src/db/db.js";
import userModel from "../src/models/users.model.js";

async function seedAdmin() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_NAME?.trim() || !ADMIN_EMAIL?.trim() ||
      typeof ADMIN_PASSWORD !== "string" || ADMIN_PASSWORD.length < 12) {
    throw new Error("Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD (at least 12 characters)");
  }
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  await connectDB();
  const email = ADMIN_EMAIL.trim().toLowerCase();
  if (await userModel.exists({ email })) {
    throw new Error("An account already exists for ADMIN_EMAIL; no account was changed");
  }
  await userModel.create({
    name: ADMIN_NAME.trim(),
    username: email,
    email,
    password: await bcrypt.hash(ADMIN_PASSWORD, 10),
    role: "admin",
  });
  console.log("Admin account created");
}

seedAdmin()
  .catch((error) => {
    console.error("Admin seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    const mongoose = await import("mongoose");
    await mongoose.default.disconnect();
  });
