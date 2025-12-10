// engine/registerSocketHandlers.js
import registerEventRouter from "../server/routers/eventRouter.js";
import { createMomentPipeline } from "../server/pipelines/moment/momentPipeline.js";
import { createPulsePipeline } from "../server/pipelines/pulse/pulsePipeline.js";

export function registerSocketHandlers(io) {
  // Instantiate pipelines once at server startup
  const momentPipeline = createMomentPipeline(io);
  const pulsePipeline = createPulsePipeline(io, momentPipeline);

  const pipelines = {
    pulsePipeline,
    momentPipeline,
  };

  io.on("connection", (socket) => {
    console.log("[ENGINE] socket connected:", socket.id);
    socket.emit("socket:connected");

    // Hand off ALL event wiring (including audience:pulse) to the router
    registerEventRouter(io, socket, pipelines);
  });
}
