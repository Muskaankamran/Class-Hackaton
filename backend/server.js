import app from "./src/app.js"
import connectDB from "./src/db/db.js"
const port = Number(process.env.PORT || process.env.Port || 3000)
import { Server } from "socket.io";
import { createServer } from "http";

async function startServer() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  await connectDB();

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: "*",
  });

  io.on("connection", (socket) => {
    console.log("Socket Connected", socket.id);
    socket.on("add-todo", (data) => {
      console.log(data);
      io.emit("send-todo", data);
    });
    socket.on("delete-todo", ({ id }) => {
      io.emit("todo-deleted", { id });
    });
  });

  httpServer.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exitCode = 1;
});