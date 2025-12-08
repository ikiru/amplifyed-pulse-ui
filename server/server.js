import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import { registerPulseHandlers } from "./registerPulseHandlers.js";

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

registerPulseHandlers(io);

const PORT = Number(process.env.PORT) || 3000;

httpServer.listen(PORT, () => {
  console.log("\n-------------------------------------------");
  console.log(" AmplifyEd Backend is RUNNING ");
  console.log(` http://localhost:${PORT}`);
  console.log("-------------------------------------------\n");
});
