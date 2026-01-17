import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import registerEventRouter from "./routers/eventRouter.js";
import { createMomentPipeline } from "./pipelines/moment/momentPipeline.js";
import { createPulsePipeline } from "./pipelines/pulse/pulsePipeline.js";
import { createMessagePipeline } from "./pipelines/message/messagePipeline.js";
import { createTrainerPipeline } from "./pipelines/trainer/trainerPipeline.js";
import { createConfusionPipeline } from "./pipelines/confusion/confusionPipeline.js";
import { registerFocusHandlers } from "./pipelines/focus/focusPipeline.js";
import { createSessionPipeline } from "./pipelines/session/sessionPipeline.js";
import { createObsPipeline } from "./pipelines/obs/obsPipeline.js";

const app = express();
const httpServer = createServer(app);

const driftGateEnabled = process.env.ENABLE_AUDIENCE_DRIFT === "true";
console.log(
  `[AUDIENCE_DRIFT] ENABLE_AUDIENCE_DRIFT=${driftGateEnabled ? "true" : "false"}`
);

app.get("/", (_req, res) => {
  res.send("AmplifyEd pulse backend is running.");
});

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

const isDevServer = process.env.NODE_ENV !== "production";
const logSocketLifecycle = (event, detail) => {
  if (!isDevServer) {
    return;
  }
  console.log(`[SERVER] socket ${event}:`, detail);
};

const momentPipeline = createMomentPipeline(io);
const sessionPipeline = createSessionPipeline(io);

const pulsePipeline = createPulsePipeline(io, {
  momentPipeline,
  sessionPipeline,
});
const confusionPipeline = createConfusionPipeline(io);
const messagePipeline = createMessagePipeline(
  io,
  pulsePipeline.momentBuilder,
  confusionPipeline
);
const trainerPipeline = createTrainerPipeline(io, pulsePipeline.momentBuilder);
const focusPipeline = registerFocusHandlers({ io, sessionPipeline });
const obsPipeline = createObsPipeline(io);
const safetyPipeline = null;
// const emotionPipeline = createEmotionPipeline(io);
// ----------------------------------------------------
// FOCUS PIPELINE (Step 6.2 — Scaffold Only)
// const focusPipeline = createFocusPipeline(io);

// ----------------------------------------------------
// MESSAGE PIPELINE (Step 6.1 — Scaffold Only)
// const messagePipeline = createMessagePipeline(io);

// ----------------------------------------------------
// SESSION PIPELINE (Step 6.3 — Scaffold Only)
// const sessionPipeline = createSessionPipeline(io);

// ----------------------------------------------------
// SAFETY PIPELINE (Step 6.4 — Scaffold Only)
// const safetyPipeline = createSafetyPipeline(io);

// ----------------------------------------------------
// TRAINER PIPELINE (Step 6.5 — Scaffold Only)
// const trainerPipeline = createTrainerPipeline(io);

io.on("connection", (socket) => {
  console.log("[SERVER] connection received:", socket.id);
  logSocketLifecycle("connect", { socketId: socket.id, reason: "connected" });

  socket.on("disconnect", (reason) => {
    logSocketLifecycle("disconnect", { socketId: socket.id, reason });
  });

  registerEventRouter(io, socket, {
    focusPipeline,
    pulsePipeline,
    trainerPipeline,
    messagePipeline,
    safetyPipeline,
    sessionPipeline,
    momentPipeline, // Phase 2.4.2
    confusionPipeline,
    obsPipeline,
  });
});

const PORT = Number(process.env.PORT) || 3000;
const HOST = "127.0.0.1"; // Binding to localhost avoids the EPERM that occurs on 0.0.0.0 in this environment.

httpServer.listen(PORT, HOST, () => {
  console.log("\n-------------------------------------------");
  console.log(" AmplifyEd Backend is RUNNING ");
  console.log(` http://localhost:${PORT}`);
  console.log("-------------------------------------------\n");
});
