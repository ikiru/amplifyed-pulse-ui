/**
 * Pulse Broadcast Module (Step 7.3.5)
 *
 * Centralizes outbound pulse updates. Behavior unchanged from previous
 * emit structure.
 */

export function createPulseBroadcast(io, pulseState) {

  // Step 7.4.2 — participants now provided externally (Session Pipeline)
  function broadcastPulseUpdate(participants) {
    const { votes, eventLog } = pulseState.state;

    if (
      process.env.NODE_ENV !== "production" &&
      participants === undefined
    ) {
      console.warn("[BROADCAST] pulse:update emitted without participants", {
        votes,
        eventLog,
      });
    }

    io.emit("pulse:update", {
      participants,
      votes,
      eventLog,
    });
  }

  return {
    broadcastPulseUpdate,
  };
}
