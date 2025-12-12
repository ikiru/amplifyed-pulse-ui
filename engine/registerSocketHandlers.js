// engine/registerSocketHandlers.js
import registerEventRouter from "../server/routers/eventRouter.js";
import { createMomentPipeline } from "../server/pipelines/moment/momentPipeline.js";
import { createPulsePipeline } from "../server/pipelines/pulse/pulsePipeline.js";
import { createEmotionPipeline } from "../server/pipelines/emotion/emotionPipeline.js";

export function registerSocketHandlers(io) {
  // Instantiate pipelines once at server startup
  // Phase 3 — Emotional Engine Activation
  const emotionPipeline = createEmotionPipeline(io);

  // Moment pipeline MUST receive emotionPipeline
  const momentPipeline = createMomentPipeline(io, emotionPipeline);

  // Pulse pipeline depends on moment pipeline
  const pulsePipeline = createPulsePipeline(io, {
    momentPipeline,
    emotionPipeline,
  });

  const pipelines = {
    pulsePipeline,
    momentPipeline,
    emotionPipeline,
  };

  io.on("connection", (socket) => {
    console.log("[ENGINE] socket connected:", socket.id);
    socket.emit("socket:connected");

    // Hand off ALL event wiring (including audience:pulse) to the router
    registerEventRouter(io, socket, pipelines);
  });
}
