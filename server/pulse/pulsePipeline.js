import { processSafetyEvent } from "../safety/index.js";
import { processEmotionEvent } from "../emotion/index.js";

const roomState = {
  participants: {},
  participantStates: {},
  votes: { engaged: 0, neutral: 0, frustrated: 0 },
  lastVoteAt: null,
  eventLog: [],
};

function applyPulse(socketId, pulse) {
  const prev = roomState.participants[socketId];

  if (prev && roomState.votes[prev] !== undefined) {
    roomState.votes[prev] = Math.max(0, roomState.votes[prev] - 1);
  }

  roomState.participants[socketId] = pulse;

  if (roomState.votes[pulse] !== undefined) {
    roomState.votes[pulse] += 1;
  }

  roomState.lastVoteAt = Date.now();

  roomState.eventLog.push({
    timestamp: roomState.lastVoteAt,
    type: "pulse",
    socketId,
    pulse,
  });

  return roomState;
}

function emitPulseUpdate(io, socketId, pulse, timestamp) {
  const updated = applyPulse(socketId, pulse);
  const value = 0;

  io.emit("pulse:update", {
    ...updated,
    timestamp,
  });

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
}

function revokeVote(socketId) {
  const prev = roomState.participants[socketId];
  if (!prev) return;

  if (roomState.votes[prev] !== undefined) {
    roomState.votes[prev] = Math.max(0, roomState.votes[prev] - 1);
  }

  delete roomState.participants[socketId];
}

export function createPulsePipeline(io) {
  return {
    handlePulse({ socketId, pulse, timestamp = Date.now() }) {
      if (!socketId || !pulse) return;
      emitPulseUpdate(io, socketId, pulse, timestamp);
    },
    // Disconnect logic removed — owned by Session Pipeline
  };
}
