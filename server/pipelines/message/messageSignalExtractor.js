// ------------------------------------------------------------------
// Message Signal Extractor (Phase 2.3.6)
// ------------------------------------------------------------------
// Owns:
//   Lightweight analysis of audience messages for signal categories.
//
// Categories (Phase 2.3 baseline):
//   - "confused"   → indicates misunderstanding
//   - "barrier"    → indicates stuck / cannot progress
//   - "clarify"    → requests explanation
//
// Future:
//   Could use LLM heuristics in Phase 5.
//
// Never:
//   Reads participants.
//   Reads pulse state.
//   Stores any long-term state.
// ------------------------------------------------------------------

export function extractMessageSignal(text = "") {
  const lower = text.toLowerCase();

  if (lower.includes("confus") || lower.includes("lost")) {
    return "confused";
  }
  if (lower.includes("stuck") || lower.includes("can't")) {
    return "barrier";
  }
  if (lower.includes("explain") || lower.includes("clarify")) {
    return "clarify";
  }

  return null;
}
