const voteState = new Map(); // sessionId -> Map(messageId -> { voters })
const NORMALIZATION = {
  upvote: "up",
  up: "up",
  downvote: "down",
  down: "down",
};

function normalizeVoteType(voteType) {
  if (typeof voteType !== "string") return null;
  return NORMALIZATION[voteType.trim().toLowerCase()] ?? null;
}

function ensureStateEntry(sessionId, messageId) {
  if (!voteState.has(sessionId)) {
    voteState.set(sessionId, new Map());
  }

  const sessionMap = voteState.get(sessionId);

  if (!sessionMap.has(messageId)) {
    sessionMap.set(messageId, { voters: new Map() });
  }

  return sessionMap.get(messageId);
}

function deriveTotals(voters) {
  let up = 0;
  let down = 0;
  voters.forEach((direction) => {
    if (direction === "up") up += 1;
    if (direction === "down") down += 1;
  });
  return { up, down };
}

function snapshotVoters(voters) {
  const snapshot = {};
  voters.forEach((direction, voterId) => {
    snapshot[voterId] = direction;
  });
  return snapshot;
}

function buildResult(entry) {
  const totals = deriveTotals(entry.voters);
  return {
    totals,
    voters: snapshotVoters(entry.voters),
  };
}

function applyVote({ sessionId, messageId, voteType, voterId, actorRole }) {
  if (!messageId || !voterId) return null;

  const state = ensureStateEntry(sessionId, messageId);
  console.log("[VOTE][STATE] before", {
    sessionId,
    messageId,
    actorRole,
    totals: deriveTotals(state.voters),
  });

  const normalized = normalizeVoteType(voteType);
  if (!normalized) {
    console.log("[VOTE][STATE] invalid voteType", {
      sessionId,
      messageId,
      actorRole,
      voteType,
    });
    return null;
  }

  const previous = state.voters.get(voterId);

  if (previous === normalized) {
    // no-op
  } else if (normalized === "up" || normalized === "down") {
    state.voters.set(voterId, normalized);
  } else {
    // explicit removal
    state.voters.delete(voterId);
  }

  const result = buildResult(state);

  console.log("[VOTE][STATE] after", {
    sessionId,
    messageId,
    actorRole,
    totals: result.totals,
  });

  return result;
}

export function getSessionVoteTotals(sessionId) {
  const sessionMap = voteState.get(sessionId);
  if (!sessionMap) {
    return {};
  }

  const totalsByMessage = {};
  sessionMap.forEach((entry, messageId) => {
    totalsByMessage[messageId] = deriveTotals(entry.voters);
  });

  return totalsByMessage;
}

export const voteStateStore = {
  applyVote,
};

export function getVoteState(messageId) {
  let up = 0;
  let down = 0;

  voteState.forEach((sessionMap) => {
    const entry = sessionMap.get(messageId);
    if (!entry) return;

    const totals = deriveTotals(entry.voters);
    up += totals.up;
    down += totals.down;
  });

  return { up, down };
}
