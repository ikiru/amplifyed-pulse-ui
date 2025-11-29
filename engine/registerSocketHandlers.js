// engine/registerSocketHandlers.js

export function registerSocketHandlers(io) {
  console.log("🔌 Socket handlers (FAKE ENGINE MODE)");

  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);

    socket.emit("socket:connected", {
      id: socket.id,
    });
  });

  // No-op for real engine for now
}

