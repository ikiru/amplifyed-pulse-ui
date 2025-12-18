function broadcastVoteUpdate({ io, messageId, participantId, voteState }) {
  io.emit("message:vote:update", {
    messageId,
    participantId,
    voteState,
  });
}

module.exports = {
  broadcastVoteUpdate,
};
