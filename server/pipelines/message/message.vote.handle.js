import { voteStateStore } from "./message.vote.state.js";
import { broadcastVoteUpdate } from "./message.vote.broadcast.js";

export function handleVoteIntent({ io, socket, payload }) {
  const {
    sessionId,
    messageId,
    voteType,
    actorRole,
  } = payload || {};

  console.log("[VOTE][HANDLE] intent received", {
    sessionId,
    messageId,
    voteType,
    actorRole,
    socketId: socket.id,
  });

  const result = voteStateStore.applyVote({
    sessionId,
    messageId,
    voteType,
    voterId: socket.id,
    actorRole,
  });

  if (!result) {
    console.log("[VOTE][HANDLE] vote rejected", {
      sessionId,
      messageId,
      voteType,
      actorRole,
      socketId: socket.id,
    });
    return;
  }

  console.log("[VOTE][HANDLE] state updated", {
    sessionId,
    messageId,
    totals: result.totals,
  });

  broadcastVoteUpdate({
    io,
    sessionId,
    messageId,
    totals: result.totals,
  });
}
