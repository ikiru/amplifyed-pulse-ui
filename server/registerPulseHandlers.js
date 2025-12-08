// server/registerPulseHandlers.js
import { processSafetyEvent } from "./safety/index.js";
import { processEmotionEvent } from "./emotion/index.js";

const roomState = {
  participants: {}, // socketId -> pulse
  participantStates: {},
  votes: { engaged: 0, neutral: 0, frustrated: 0 },
  lastVoteAt: null,
  eventLog: [],
};

function applyPulse(socketId, pulse) {
  // In Phase 2, "pulse" is a simple string: "engaged" | "neutral" | "frustrated"

  if (!pulse) return roomState;

  const prev = roomState.participants[socketId]; // old pulse

  // decrement previous vote
  if (prev && roomState.votes[prev] !== undefined) {
    roomState.votes[prev] = Math.max(0, roomState.votes[prev] - 1);
  }

  // assign new vote
  roomState.participants[socketId] = pulse;

  if (roomState.votes[pulse] !== undefined) {
    roomState.votes[pulse] += 1;
  }

  // remove score logic completely
  // score is now computed client-side only

  roomState.lastVoteAt = Date.now();

  roomState.eventLog.push({
    timestamp: roomState.lastVoteAt,
    type: "pulse",
    socketId,
    pulse,
  });

  return roomState;
}

export function registerPulseHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`[SERVER] client connected: ${socket.id}`);

    socket.on("audience:pulse", (payload = {}) => {
      console.log("🔥 RAW SERVER PAYLOAD:", payload);

      const pulse = payload.pulse; // pulse is a string

      const timestamp = Date.now();

      console.log("[SERVER] audience:pulse RECEIVED:", pulse);

      // update canonical pulse state
      const updated = applyPulse(socket.id, pulse);

      const value = 0; // Phase 2: value not used in pulse scoring

      // send FULL STATE to all clients
      io.emit("pulse:update", {
        ...updated,
        timestamp,
      });

      // Emotional engine receives pulse via "emotion" field
      // This is the ONLY allowed use of "emotion" in the pipeline.
      processEmotionEvent(io, {
        type: "pulse",
        emotion: pulse,
        pulse,
        value,
        timestamp,
      });

      processSafetyEvent(io, {
        type: "pulse",
        value,
        timestamp,
      });
    });
  });
}
