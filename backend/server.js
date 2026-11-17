import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import connectDB from "./src/db/db.js";
import { seedAdminUser } from "./src/db/seed.js";

const port = process.env.PORT || process.env.Port || 3000;

async function startServer() {
  await connectDB();
  await seedAdminUser();

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

startServer();
