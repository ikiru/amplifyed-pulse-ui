// server/registerPulseHandlers.js
import { processSafetyEvent } from "./safety/index.js";
import { processEmotionEvent } from "./emotion/index.js";

export function registerPulseHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`[SERVER] client connected: ${socket.id}`);

    socket.on("audience:pulse", ({ emotion, value = 0 }) => {
      console.log(`[SERVER] audience:pulse RECEIVED: ${emotion}`);

      const payload = {
        emotion,
        value,
        timestamp: Date.now()
      };

      io.emit("pulse:update", payload);

      processEmotionEvent(io, {
        type: "pulse",
        emotion: payload.emotion,
        value: payload.value,
        timestamp: payload.timestamp
      });

      processSafetyEvent(io, {
        type: "pulse",
        value: payload.value,
        timestamp: payload.timestamp
      });
    });
  });
}
