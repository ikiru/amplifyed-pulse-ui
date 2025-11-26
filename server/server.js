// server/server.js
import http from "http";
import { Server } from "socket.io";
import { registerPulseSimulator } from "./registerPulseSimulator.js";
import { registerFakeEngineHandlers } from "../engine/registerFakeEngineHandlers.js";

console.log("🚧 Running with FAKE ENGINE");

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// ⬅️ Boot the fake engine socket pipeline
registerFakeEngineHandlers(io);

// 🔥 Start Pulse Simulator
registerPulseSimulator(io);

const PORT = 5174;

server.listen(PORT, () => {
  console.log(`Socket server running on http://localhost:${PORT}`);
});
