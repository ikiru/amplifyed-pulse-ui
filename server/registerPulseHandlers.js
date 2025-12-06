// server/registerPulseHandlers.js
export function registerPulseHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`[SERVER] client connected: ${socket.id}`);

    socket.on("audience:pulse", ({ emotion }) => {
      // Pulse handling is centralized in server.js
      console.log(`[SERVER] audience:pulse (ignored here): ${emotion}`);
    });
  });
}
