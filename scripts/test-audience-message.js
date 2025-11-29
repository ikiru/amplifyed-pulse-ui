import crypto from "crypto";
import { io } from "socket.io-client";

const SOCKET_URL = process.env.SOCKET_URL?.trim() || "http://localhost:3000";
const socket = io(SOCKET_URL, {
  transports: ["websocket"],
});

const payload = {
  id: crypto.randomUUID(),
  role: "participant",
  text: `Automated audience ping @ ${new Date().toISOString()}`,
  timestamp: Date.now(),
};

let received = false;
let timeoutId = null;
let done = false;

const finish = (success, message) => {
  if (done) return;
  done = true;
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  console.log(message);
  socket.disconnect();
  process.exit(success ? 0 : 1);
};

socket.on("connect", () => {
  console.log(`[Test] connected as ${socket.id}`);
  console.log("[Test] emitting audience:message =>", payload);
  socket.emit("audience:message", payload);

  timeoutId = setTimeout(() => {
    if (!received) {
      finish(false, "[Test] timeout waiting for audience:message echo.");
    }
  }, 6000);
});

socket.on("audience:message", (msg) => {
  console.log("[Test] received audience:message:", msg);
  if (msg?.id === payload.id) {
    received = true;
    finish(true, "[Test] Server echoed the audience message as expected.");
  }
});

socket.on("connect_error", (err) => {
  finish(false, `[Test] connection error: ${err.message}`);
});

socket.on("disconnect", () => {
  if (!received) {
    finish(false, "[Test] disconnected before seeing the echo.");
  }
});
