const voteState = new Map(); // messageId -> { totals, voters }
const NORMALIZATION = {
  upvote: "up",
  up: "up",
  downvote: "down",
  down: "down",
  none: "none",
};

function normalizeVoteType(voteType) {
  if (typeof voteType !== "string") return null;
  return NORMALIZATION[voteType.trim().toLowerCase()] ?? null;
}

function ensureStateEntry(messageId) {
  if (!voteState.has(messageId)) {
    voteState.set(messageId, {
      totals: { up: 0, down: 0 },
      voters: new Map(),
    });
  }
  return voteState.get(messageId);
}

function cloneTotals(totals) {
  return { up: totals.up, down: totals.down };
}

function snapshotVoters(voters) {
  const snapshot = {};
  voters.forEach((direction, voterId) => {
    snapshot[voterId] = direction;
  });
  return snapshot;
}

function buildResult(entry) {
  return {
    totals: cloneTotals(entry.totals),
    voters: snapshotVoters(entry.voters),
  };
}

function applyVote({ sessionId, messageId, voteType, voterId, actorRole }) {
  if (!messageId || !voterId) return null;

  const state = ensureStateEntry(messageId);
  console.log("[VOTE][STATE] before", {
    sessionId,
    messageId,
    actorRole,
    totals: { ...state.totals },
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

  if (previous !== normalized) {
    if (previous === "up") {
      state.totals.up = Math.max(0, state.totals.up - 1);
    }
    if (previous === "down") {
      state.totals.down = Math.max(0, state.totals.down - 1);
    }

    if (normalized === "up") {
      state.totals.up += 1;
      state.voters.set(voterId, normalized);
    } else if (normalized === "down") {
      state.totals.down += 1;
      state.voters.set(voterId, normalized);
    } else {
      state.voters.delete(voterId);
    }
  }

  const result = buildResult(state);

  console.log("[VOTE][STATE] after", {
    sessionId,
    messageId,
    actorRole,
    totals: { ...state.totals },
  });

  return result;
}

export const voteStateStore = {
  applyVote,
};

export function getVoteState(messageId) {
  const entry = voteState.get(messageId);
  if (!entry) {
    return { up: 0, down: 0 };
  }
  return cloneTotals(entry.totals);
}
