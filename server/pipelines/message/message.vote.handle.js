const voteStateStore = require("./message.vote.state");
const voteBroadcast = require("./message.vote.broadcast");

const ALLOWED = new Set(["up", "down", "none"]);

function handleVoteIntent({ io, socket, payload }) {
  const { messageId, voteState } = payload || {};
  const participantId = socket.id;

  if (!messageId || !ALLOWED.has(voteState)) return;

  const current = voteStateStore.getVote(participantId, messageId);
  if (current === voteState) return;

  voteStateStore.setVote(participantId, messageId, voteState);

  voteBroadcast.broadcastVoteUpdate({
    io,
    messageId,
    participantId,
    voteState,
  });
}

module.exports = {
  handleVoteIntent,
};
