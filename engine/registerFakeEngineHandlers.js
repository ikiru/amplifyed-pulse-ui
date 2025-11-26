// engine/registerFakeEngineHandlers.js
import { fakeEngine } from "./fakeEngine.js";

export function registerFakeEngineHandlers(io) {
  io.on("connection", (socket) => {
    console.log("[FAKE ENGINE] Client connected:", socket.id);

    // TRAINER MESSAGE
    socket.on("trainer:message", async (payload) => {
      io.emit("trainer:message", { message: payload });
      const events = await fakeEngine({ type: "trainerMessage", payload });
      broadcast(io, events);
    });

    // AUDIENCE MESSAGE
    socket.on("audience:message", async (payload) => {
      io.emit("audience:message", { message: payload });
      const events = await fakeEngine({ type: "audienceMessage", payload });
      broadcast(io, events);
    });

    // AUDIENCE SIGNAL
    socket.on("audience:signal", async (payload) => {
      const events = await fakeEngine({ type: "audienceSignal", payload });
      broadcast(io, events);
    });

    // TRAINER FOCUS
    socket.on("trainer:focus", async (payload) => {
      io.emit("focus:change", { activeTurnId: payload.targetTurnId });
      const events = await fakeEngine({ type: "trainerFocus", payload });
      broadcast(io, events);
    });

    // MOVE REQUEST
    socket.on("engine:move:request", async (payload) => {
      const events = await fakeEngine({ type: "moveRequest", payload });
      broadcast(io, events);
    });
  });
}

function broadcast(io, events) {
  for (const e of events) {
    if (e.type === "move")
      io.emit("engine:move", { move: e.move, reasoning: e.reasoning });

    if (e.type === "pulse")
      io.emit("pulse:update", { values: e.values });

    if (e.type === "focus")
      io.emit("focus:change", { activeTurnId: e.activeTurnId });
  }
}
