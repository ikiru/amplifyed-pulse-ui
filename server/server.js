// server/server.js
import { createServer } from "http";
import { Server } from "socket.io";
import { registerSocketHandlers } from "../engine/registerSocketHandlers.js";

console.log("🚧 Running with FAKE ENGINE");

const httpServer = createServer();
const io = new Server(httpServer, { cors: { origin: "*" } });

registerSocketHandlers(io);

httpServer.listen(4000, () => {
  console.log("Socket server running on http://localhost:4000");
});
