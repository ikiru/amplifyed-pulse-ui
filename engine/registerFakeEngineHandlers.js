// engine/registerFakeEngineHandlers.js
// Hook fake engine into the socket server.

import { startFakeEngine } from "./fakeEngine.js";

export function registerFakeEngineHandlers(io) {
  io.on("connection", (socket) => {
    console.log("📡 FakeEngine: client connected", socket.id);

    socket.emit("engine:status", {
      status: "fake-engine-active"
    });
  });

  // Start fake pulse loop
  startFakeEngine(io);
}
