// server/server.js
import http from "http";
import { Server } from "socket.io";

// ===============================================
//  ENGINE INSIGHT PACKET MUTE SWITCH (GLOBAL)
// ===============================================
let ENGINE_MUTE = true; // Default: engine muted

function setEngineMute(value) {
  ENGINE_MUTE = Boolean(value);
  console.log(`[ENGINE] mute = ${ENGINE_MUTE}`);
}

// ================= ROOM EMOTIONAL STATE ENGINE ===================
// Track each participant’s CURRENT emotional vote (1, 0, -1)
const roomState = new Map(); // socket.id -> { emotion, value }

function normalizeEmotion(emotion) {
  if (emotion === "engaged") return { emotion, value: +1 };
  if (emotion === "frustrated") return { emotion, value: -1 };
  return { emotion: "neutral", value: 0 };
}

function computeRoomState() {
  let engaged = 0;
  let neutral = 0;
  let frustrated = 0;
  let score = 0;

  for (const { emotion, value } of roomState.values()) {
    if (emotion === "engaged") engaged++;
    else if (emotion === "frustrated") frustrated++;
    else neutral++;
    score += value;
  }

  return {
    counts: { engaged, neutral, frustrated },
    score,
    timestamp: Date.now(),
  };
}

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("[SERVER] CONNECTED:", socket.id);
  console.log("[SERVER] TOTAL CLIENTS:", io.engine.clientsCount);

  // -------------------------------
  // AUDIENCE PULSE HANDLING (NEW ROOM ENGINE)
  // -------------------------------
  socket.on("audience:pulse", (payload = {}) => {
    const raw = payload?.emotion ?? "neutral";
    const normalized = normalizeEmotion(raw);

    roomState.set(socket.id, normalized);

    const summary = computeRoomState();
    io.emit("pulse:roomstate", summary);
  });

  // On disconnect → remove vote and recompute
  socket.on("disconnect", () => {
    roomState.delete(socket.id);
    const summary = computeRoomState();
    io.emit("pulse:roomstate", summary);

    console.log("[SERVER] DISCONNECTED:", socket.id);
    console.log("[SERVER] TOTAL CLIENTS:", io.engine.clientsCount);
  });

  // -------------------------------
  // MESSAGE RELAY
  // -------------------------------
  socket.on("audience:message", (payload = {}) => {
    io.emit("message:new", {
      from: "audience",
      text: payload?.text ?? payload?.message ?? "",
      timestamp: Date.now(),
    });
  });

  socket.on("trainer:message", (payload = {}) => {
    io.emit("message:new", {
      from: "trainer",
      text: payload?.text ?? payload?.message ?? "",
      timestamp: Date.now(),
    });
  });

  // -------------------------------
  // FOCUS TRACKING
  // -------------------------------
  socket.on("trainer:setfocus", (payload = {}) => {
    io.emit("focus:update", {
      id: payload?.id ?? payload?.messageId ?? null,
      timestamp: Date.now(),
    });
  });

  socket.on("debug:setEngineMute", (value) => {
    setEngineMute(value);
  });

  socket.on("message:new", (msg = {}) => {
    io.emit("message:new", {
      ...msg,
      text: msg.text ?? msg.message ?? "",
    });
  });

  // -----------------------------------------------------
  // TEMPORARY FAKE SIGNAL EMITTER (Phase 2.3 Testing Only)
  // -----------------------------------------------------
  if (!global.__signalEmitterStarted) {
    global.__signalEmitterStarted = true;

    setInterval(() => {
      const payload = {
        type: "insight",
        value: Math.random(),
        timestamp: Date.now(),
      };

      if (!ENGINE_MUTE) {
        io.emit("engine:insight", payload);
      }
    }, 500);
  }

});

const PORT = 3000;
server.listen(PORT, () => {
  console.log("\n-------------------------------------------");
  console.log(" 🛰️  AmplifyEd Backend is RUNNING ");
  console.log(` 🌐  http://localhost:${PORT}`);
  console.log("-------------------------------------------\n");
});
