// engine/registerSocketHandlers.js
import { fakeEngine } from "./fakeEngine.js";

export function registerSocketHandlers(io) {
  const engine = fakeEngine;

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("trainer:message", async (payload) => {
      io.emit("trainer:message", { message: payload });
      const events = await engine({ type: "trainerMessage", payload });
      dispatchEngineEvents(io, events);
    });

    socket.on("audience:message", async (payload) => {
      io.emit("audience:message", { message: payload });
      const events = await engine({ type: "audienceMessage", payload });
      dispatchEngineEvents(io, events);
    });

    socket.on("audience:signal", async (payload) => {
      const events = await engine({ type: "audienceSignal", payload });
      dispatchEngineEvents(io, events);
    });

    socket.on("trainer:focus", async (payload) => {
      io.emit("focus:change", { activeTurnId: payload.targetTurnId });
      const events = await engine({ type: "trainerFocus", payload });
      dispatchEngineEvents(io, events);
    });

    socket.on("engine:move:request", async (payload) => {
      const events = await engine({ type: "moveRequest", payload });
      dispatchEngineEvents(io, events);
    });
  });
}

function dispatchEngineEvents(io, events = []) {
  for (const evt of events) {
    if (evt.type === "move") {
      io.emit("engine:move", { move: evt.move, reasoning: evt.reasoning });
    }

    if (evt.type === "pulse") {
      io.emit("pulse:update", { values: evt.values });
    }

    if (evt.type === "focus") {
      io.emit("focus:change", { activeTurnId: evt.activeTurnId });
    }
  }
}
