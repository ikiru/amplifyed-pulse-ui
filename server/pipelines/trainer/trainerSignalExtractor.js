// ------------------------------------------------------------------
// Trainer Signal Extractor (Phase 2.3.7)
// ------------------------------------------------------------------
// Converts trainer action payloads into a normalized signal form.
//
// Supported baseline signals:
//   - "nudge"
//   - "slowdown"
//   - "speedup"
//   - "break"
//   - "checkin"
//
// Future expansion:
//   - AI Applied Trainer Signals (Phase 5)
//
// Never:
//   Reads participants
//   Reads pulse/emotion state
//   Writes logs
// ------------------------------------------------------------------

export function extractTrainerSignal(action) {
  if (!action) return null;

  const key = action.toLowerCase();

  const allowed = {
    nudge: "nudge",
    slowdown: "slowdown",
    speedup: "speedup",
    break: "break",
    checkin: "checkin",
  };

  return allowed[key] || null;
}
