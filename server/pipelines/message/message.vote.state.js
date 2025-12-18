const voteState = new Map();
// key: `${participantId}:${messageId}`
// value: "up" | "down" | "none"

function getKey(participantId, messageId) {
  return `${participantId}:${messageId}`;
}

function getVote(participantId, messageId) {
  return voteState.get(getKey(participantId, messageId)) || "none";
}

function setVote(participantId, messageId, voteStateValue) {
  voteState.set(getKey(participantId, messageId), voteStateValue);
}

const voteStateStore = {
  getVote,
  setVote,
};

export { voteStateStore };
