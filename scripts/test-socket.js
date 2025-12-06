import { io } from "socket.io-client";

const SOCKET_URL = process.env.SOCKET_URL?.trim() || "http://localhost:3000";
const socket = io(SOCKET_URL, {
  transports: ["websocket"],
});

console.log("🔧 TEST — SOCKET + TRAINERVIEW");

socket.on("connect", () => {
  console.log(`[Test] connected as ${socket.id}`);
  socket.emit("audience:pulse", { emotion: "engaged" });
  socket.emit("audience:message", { message: "hello trainer!" });

  setTimeout(() => {
    console.log("Done.");
    socket.disconnect();
  }, 1000);
});

socket.on("connect_error", (err) => {
  console.error("[Test] connection error:", err?.message);
  socket.disconnect();
});
