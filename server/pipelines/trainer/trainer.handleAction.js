export function handleTrainerAction(io, socket) {
  socket.on("trainer:action", (payload = {}) => {
    const enriched = {
      ts: payload.ts || Date.now(),
      action: payload.action || "advance",
      socketId: socket.id,
    };

    io.emit("trainer:signal", enriched);
    console.log("[trainer:action] emitted trainer:signal", enriched);
  });
}
