import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import eventRouter from "./routers/eventRouter.js";
import { createPulsePipeline } from "./pulse/pulsePipeline.js";
import { createMessagePipeline } from "./pipelines/message/messagePipeline.js";
import { createTrainerPipeline } from "./pipelines/trainer/trainerPipeline.js";

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
const messagePipeline = createMessagePipeline(io, pulsePipeline.momentBuilder);
const trainerPipeline = createTrainerPipeline(io, pulsePipeline.momentBuilder);
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
  
  // Step 6.1 — message pipeline will be activated in Step 7
  messagePipeline,

  // Step 6.2 — focus pipeline wiring added but not activated
  // focusPipeline,

  // Step 6.3 — session pipeline prepared but not activated
  // sessionPipeline,

  // Step 6.4 — Safety pipeline prepared but not activated
  // safetyPipeline,

  // Step 6.5 — trainer pipeline prepared but not activated
  trainerPipeline,
});

const PORT = Number(process.env.PORT) || 3000;

httpServer.listen(PORT, () => {
  console.log("\n-------------------------------------------");
  console.log(" AmplifyEd Backend is RUNNING ");
  console.log(` http://localhost:${PORT}`);
  console.log("-------------------------------------------\n");
});
