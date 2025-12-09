import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import eventRouter from "./routers/eventRouter.js";
import { createPulsePipeline } from "./pulse/pulsePipeline.js";

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

const pulsePipeline = createPulsePipeline(io);

/**
 * NEW unified event router
 * --------------------------------------------------
 * We forward all socket events into the router, and
 * the router decides which pipeline handles what.
 */
eventRouter(io, {
  pulsePipeline,
  // emotionPipeline,
  // focusPipeline,
});

const PORT = Number(process.env.PORT) || 3000;

httpServer.listen(PORT, () => {
  console.log("\n-------------------------------------------");
  console.log(" AmplifyEd Backend is RUNNING ");
  console.log(` http://localhost:${PORT}`);
  console.log("-------------------------------------------\n");
});
