export function broadcastVoteUpdate({ io, sessionId, messageId, totals }) {
  const payload = {
    sessionId,
    messageId,
    totals,
  };

  if (sessionId) {
    io.to(sessionId).emit("message:vote:update", payload);
    io.to(sessionId).emit("message.vote.update", payload);
    return;
  }

  // Backwards-compat: if sessionId is missing, fall back to global emit.
  io.emit("message:vote:update", payload);
  io.emit("message.vote.update", payload);
}

export const voteBroadcast = {
  broadcastVoteUpdate,
};
