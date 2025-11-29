import { analyzeEvent } from "./softFlagEngine.js";
import { SAFETY_ENABLED, SOFT_FLAG_EVENT } from "./safetyConfig.js";

export function processSafetyEvent(io, event) {
  if (!SAFETY_ENABLED) return;

  const flags = analyzeEvent(event);
  if (!flags.length) return;

  flags.forEach(flag => {
    io.emit(SOFT_FLAG_EVENT, flag);
  });
}
