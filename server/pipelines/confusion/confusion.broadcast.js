/**
 * Confusion Broadcast
 *
 * Emits trainer-facing advisory updates.
 * Never exposes raw scores.
 * Never orders threads.
 */

// BEGIN CONFUSION SIGNAL

export function broadcastConfusionUpdate({
  io,
  sessionId,
  envelopes = [],
}) {
  if (!io || !sessionId || !Array.isArray(envelopes)) return;

  const threads = envelopes.map((entry) => ({
    rootMessageId: entry.rootMessageId,
    level: entry.level,
    contributors: entry.contributors,
    resolvedAt: entry.resolvedAt,
    resolvedBy: entry.resolvedBy,
    resolutionType: entry.resolutionType,
  }));

  io.to(sessionId).emit("confusion:update", {
    sessionId,
    threads,
  });
}

// END CONFUSION SIGNAL
