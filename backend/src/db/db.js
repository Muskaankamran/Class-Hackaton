import 'dotenv/config';
import dns from 'node:dns/promises';
dns.setServers(['1.1.1.1', '8.8.8.8']);

import chalk from 'chalk';
import mongoose from 'mongoose';
import userModel from '../models/users.model.js';

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }
  await mongoose.connect(process.env.MONGODB_URI);
  await userModel.updateMany(
    { role: "user" },
    { $set: { role: "patient" } },
  );
  await userModel.updateMany(
    {
      username: { $type: "string" },
      $or: [{ name: { $exists: false } }, { name: null }, { name: "" }],
    },
    [{ $set: { name: "$username" } }],
    { updatePipeline: true },
  );
  console.log(chalk.white.bgGreen.bold("Connected to DB"));
}

export default main;