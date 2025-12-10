export function registerSocketHandlers(io) {
  io.on("connection", async (socket) => {
    console.log("[ENGINE] socket connected:", socket.id);
    socket.emit("socket:connected");

    //
    // ------------------------------------------------------------
    // PULSE PIPELINE REGISTRATION
    // ------------------------------------------------------------
    //
    try {
      const { handlePulseSubmit } = await import(
        "../server/pipelines/pulse/pulse.handleSubmit.js"
      );

      socket.on("pulse:submit", (payload) => {
        handlePulseSubmit(io, socket, payload);
      });

      console.log("[ENGINE] Pulse pipeline wired.");
    } catch (err) {
      console.error("[ENGINE] Failed to wire pulse pipeline:", err);
    }
  });
}
