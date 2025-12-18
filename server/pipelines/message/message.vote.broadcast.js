export function broadcastVoteUpdate({ io, sessionId, messageId, totals }) {
  const payload = {
    sessionId,
    messageId,
    totals,
  };

  io.emit("message:vote:update", payload);
  io.emit("message.vote.update", payload);
}

export const voteBroadcast = {
  broadcastVoteUpdate,
};
