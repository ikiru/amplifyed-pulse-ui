const voteState = new Map(); // messageId -> Map(participantId -> direction)
const VALID_DIRECTIONS = new Set(["up", "down", "none"]);

function getMessageVotes(messageId) {
  if (!voteState.has(messageId)) {
    voteState.set(messageId, new Map());
  }
  return voteState.get(messageId);
}

function summarizeVotes(votesByParticipant) {
  const summary = {
    counts: {
      up: 0,
      down: 0,
      none: 0,
    },
    votes: {},
  };

  votesByParticipant.forEach((direction, participantId) => {
    if (VALID_DIRECTIONS.has(direction)) {
      summary.counts[direction] += 1;
      summary.votes[participantId] = direction;
    }
  });

  return summary;
}

export function recordVote(messageId, participantId, direction) {
  if (!messageId || !participantId || !VALID_DIRECTIONS.has(direction)) return;
  const votesByParticipant = getMessageVotes(messageId);
  votesByParticipant.set(participantId, direction);
}

export function getVoteState(messageId) {
  const votesByParticipant = voteState.get(messageId);
  if (!votesByParticipant) {
    return summarizeVotes(new Map());
  }
  return summarizeVotes(votesByParticipant);
}
