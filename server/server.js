// server/server.js
import http from "http";
import { Server } from "socket.io";
import crypto from "crypto";
import { normalizeEmotionValue } from "../src/config/pulseLogic.js";
import EVENTS from "../src/socket/events.js";

// ===============================================
//  ENGINE INSIGHT PACKET MUTE SWITCH (GLOBAL)
// ===============================================
let ENGINE_MUTE = true; // Default: engine muted

function setEngineMute(value) {
  ENGINE_MUTE = Boolean(value);
  console.log(`[ENGINE] mute = ${ENGINE_MUTE}`);
}

const AUDIENCE_PULSE_HISTORY_LIMIT = 240;
const audiencePulseHistory = [];

// North Star: Each user has one emotional state (no decay)
const userStates = new Map();

const normalizeAudiencePulse = (payload = {}) => {
  const emotion =
    typeof payload.emotion === "string" && payload.emotion.trim().length
      ? payload.emotion.trim().toLowerCase()
      : "neutral";
  const timestamp = Number.isFinite(payload.timestamp)
    ? payload.timestamp
    : Date.now();
  const valueCandidate =
    typeof payload.value === "number" && Number.isFinite(payload.value)
      ? payload.value
      : undefined;
  const normalizedValue = normalizeEmotionValue(emotion, valueCandidate);
  audiencePulseHistory.push(normalizedValue);
  if (audiencePulseHistory.length > AUDIENCE_PULSE_HISTORY_LIMIT) {
    audiencePulseHistory.shift();
  }

  return {
    emotion,
    value: normalizedValue,
    values: [...audiencePulseHistory],
    timestamp,
    source: "audience",
    signal: "audience",
  };
};

const buildTrainerMessage = (payload = {}) => {
  const candidateText =
    typeof payload.message === "string" && payload.message.trim().length
      ? payload.message.trim()
      : typeof payload.text === "string" && payload.text.trim().length
      ? payload.text.trim()
      : typeof payload === "string"
      ? payload.trim()
      : "";
  if (!candidateText) return null;

  return {
    id: payload.id ?? crypto.randomUUID(),
    text: candidateText,
    message: candidateText,
    role: payload.role ?? "participant",
    timestamp: Number.isFinite(payload.timestamp)
      ? payload.timestamp
      : Date.now(),
  };
};

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("[SERVER] client connected", socket.id);

  // -------------------------------
  // TRAINER SET FOCUS
  // -------------------------------
  socket.on("trainer:setFocus", (payload = {}) => {
    try {
      console.log("[SERVER] trainer:setFocus IN:", payload);
      io.emit("trainer:setFocus", payload);
    } catch (err) {
      console.error("[SERVER] trainer:setFocus error:", err);
    }
  });

  function normalizePulse(payload = {}) {
    const normalized = normalizeAudiencePulse(payload);
    if (!normalized) return null;
    return {
      type: "pulse",
      emotion: normalized.emotion,
      value: Number.isFinite(normalized.value) ? normalized.value : 0,
      timestamp: Number.isFinite(normalized.timestamp)
        ? normalized.timestamp
        : Date.now(),
      source: normalized.source || "audience",
      signal: normalized.signal || "audience",
      values: Array.isArray(normalized.values) ? normalized.values : [],
      color: normalized.color,
      level: normalized.level ?? normalized.value,
    };
  }

  function normalizeMessage(payload = {}) {
    const message = buildTrainerMessage(payload);
    if (!message) return null;
    return {
      type: "message",
      sender: message.role || "participant",
      role: message.role,
      id: message.id,
      message: message.text,
      text: message.text,
      time: Number.isFinite(message.timestamp)
        ? message.timestamp
        : Date.now(),
    };
  }

  socket.on(EVENTS.AUDIENCE_PULSE, (payload) => {
    console.log("[SERVER] audience:pulse IN:", payload);
    try {
      if (!payload || !payload.emotion) {
        console.warn("[SERVER] missing emotion in audience pulse:", payload);
        return;
      }

      userStates.set(socket.id, payload.emotion);

      const packet = normalizePulse(payload);
      if (!packet) {
        console.warn("[SERVER] invalid audience pulse payload:", payload);
        return;
      }

      const enriched = {
        ...packet,
        userId: socket.id,
        emotion: payload.emotion,
      };

      io.emit(EVENTS.PULSE_UPDATE, enriched);
      console.log("[SERVER] pulse:update OUT:", enriched);
    } catch (err) {
      console.error("🔥 Failed to process AUDIENCE_PULSE", err);
    }
  });

  socket.on(EVENTS.AUDIENCE_MESSAGE, (payload) => {
    console.log("[SERVER] audience:message IN:", payload);
    try {
      if (!payload || typeof payload.message !== "string") {
        console.warn(
          "[SERVER] audience:message skipping invalid payload:",
          payload
        );
        return;
      }

      const timestamp = Number.isFinite(payload.timestamp)
        ? payload.timestamp
        : Date.now();
      const message = {
        type: "message",
        text: payload.message,
        message: payload.message,
        timestamp,
        source: payload.source || "audience",
        author: payload.author || payload.sender || "audience",
      };

      io.emit("message:update", message);

      console.log("[SERVER] message:update OUT:", message);

      const packet = normalizeMessage(payload);
      if (!packet) {
        console.warn(
          "[SERVER] invalid audience message payload for trainer:",
          payload
        );
        return;
      }

      io.emit("trainer:message", packet);
      console.log("[SERVER] trainer:message OUT:", packet);
    } catch (err) {
      console.error("🔥 Server failed to relay AUDIENCE_MESSAGE", err);
    }
  });

  // REAL Trainer Messages → Everyone
  socket.on("trainer:message", (msg) => {
    console.log("[SERVER] received trainer message:", msg);
    if (!msg || typeof msg.text !== "string") {
      console.log("[SERVER] invalid trainer message:", msg);
      return;
    }
    io.emit("trainer:message", msg);
  });

  socket.on("debug:setEngineMute", (value) => {
    setEngineMute(value);
  });

  socket.on("message:new", (msg = {}) => {
    // Phase 3.5 safety placeholder:
    // if (isBlockedContent(msg.text)) { ... }

    io.emit("message:new", msg);
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
