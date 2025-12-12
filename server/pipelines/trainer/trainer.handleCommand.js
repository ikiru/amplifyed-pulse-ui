export function handleTrainerCommand(io, socket) {
  socket.on("trainer:command", (payload = {}) => {
    const enriched = {
      ts: payload.ts || Date.now(),
      command: payload.command || "unknown",
      socketId: socket.id,
    };

    io.emit("trainer:signal", enriched);
    console.log("[trainer:command] emitted trainer:signal", enriched);
  });
}
