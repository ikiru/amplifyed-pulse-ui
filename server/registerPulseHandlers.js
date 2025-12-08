// server/registerPulseHandlers.js
import { processSafetyEvent } from "./safety/index.js";
import { processEmotionEvent } from "./emotion/index.js";

const roomState = {
  participants: {}, // socketId -> emotion
  participantStates: {},
  votes: { engaged: 0, neutral: 0, frustrated: 0 },
  lastVoteAt: null,
  eventLog: [],
};

function applyPulse(socketId, pulse) {
  const emotion = pulse?.emotion;
  if (!emotion) return roomState;

  const prev = roomState.participants[socketId];

  // decrement previous vote
  if (prev && roomState.votes[prev] !== undefined) {
    roomState.votes[prev] = Math.max(0, roomState.votes[prev] - 1);
  }

  // assign new vote
  roomState.participants[socketId] = emotion;

  if (roomState.votes[emotion] !== undefined) {
    roomState.votes[emotion] += 1;
  }

  // remove score logic completely
  // score is now computed client-side only

  roomState.lastVoteAt = Date.now();

  roomState.eventLog.push({
    timestamp: roomState.lastVoteAt,
    type: "pulse",
    socketId,
    emotion,
    pulse,
  });

  return roomState;
}

export function registerPulseHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`[SERVER] client connected: ${socket.id}`);

    socket.on("audience:pulse", (payload = {}) => {
      const legacyEmotion = payload?.emotion;
      const pulse =
        payload?.pulse ??
        ({
          emotion: legacyEmotion ?? "neutral",
          value: payload?.value ?? 0,
        });
      const value = pulse.value ?? payload?.value ?? 0;
      const timestamp = Date.now();

      console.log(`[SERVER] audience:pulse RECEIVED: ${pulse.emotion}`);

      // applyPulse() already updated roomState
      const updated = applyPulse(socket.id, pulse);

      // send FULL STATE to all clients
      io.emit("pulse:update", {
        ...updated,
        timestamp,
      });

      processEmotionEvent(io, {
        type: "pulse",
        emotion: pulse.emotion,
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
