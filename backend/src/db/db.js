import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

import mongoose from "mongoose";

async function connectDB() {
  try {
    if (mongoose.connection.readyState === 1) {
      return;
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
}

export default connectDB;
