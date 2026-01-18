/**
 * Pulse Broadcast Module (Step 7.3.5)
 *
 * Centralizes outbound pulse updates. Behavior unchanged from previous
 * emit structure.
 */

export function createPulseBroadcast(io, pulseState) {

  // Step 7.4.2 — participants now provided externally (Session Pipeline)
  function broadcastPulseUpdate(sessionId, participants) {
    const snapshot = pulseState.getSessionSnapshot?.(sessionId) ?? {
      votes: {},
      eventLog: [],
    };
    const votes = snapshot.votes ?? {};
    const eventLog = snapshot.eventLog ?? [];
    const ts = Date.now();

    if (participants == null) {
      const errorMessage =
        "[BROADCAST] pulse:update requires canonical participants map";
      if (process.env.NODE_ENV !== "production") {
        console.error(errorMessage, {
          votes,
          eventLog,
          ts,
        });
      }
      throw new Error(errorMessage);
    }

    const participantsCount = Object.keys(participants).length;

    if (!sessionId) {
      // Backwards-compat: if sessionId is missing, fall back to global emit.
      io.emit("pulse:update", {
        participants,
        participantsCount,
        votes,
        eventLog,
        ts,
      });
      return;
    }

    io.to(sessionId).emit("pulse:update", {
      participants,
      participantsCount,
      votes,
      eventLog,
      ts,
    });
  }

  return {
    broadcastPulseUpdate,
  };
}
