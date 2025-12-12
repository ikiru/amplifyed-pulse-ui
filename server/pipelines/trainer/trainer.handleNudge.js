export function handleTrainerNudge(io, socket) {
  socket.on("trainer:nudge", (payload = {}) => {
    const enriched = {
      ts: payload.ts || Date.now(),
      nudge: payload.nudge || "soft",
      socketId: socket.id,
    };

    io.emit("trainer:signal", enriched);
    console.log("[trainer:nudge] emitted trainer:signal", enriched);
  });
}
