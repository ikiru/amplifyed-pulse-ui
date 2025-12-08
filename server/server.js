import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);

app.get("/", (_req, res) => {
  res.send("AmplifyEd pulse backend is running.");
});

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("[Server] Client connected:", socket.id);

  socket.on("audience:pulse", (payload) => {
    const outbound = {
      socketId: payload?.socketId ?? socket.id,
      emotion: payload?.emotion ?? null,
    };
    io.emit("audience:pulse", outbound);
  });

  socket.on("disconnect", () => {
    console.log("[Server] Client disconnected:", socket.id);
  });
});

const PORT = Number(process.env.PORT) || 3000;

httpServer.listen(PORT, () => {
  console.log("\n-------------------------------------------");
  console.log(" AmplifyEd Backend is RUNNING ");
  console.log(` http://localhost:${PORT}`);
  console.log("-------------------------------------------\n");
});
