import { updateStateMap } from "./stateMapEngine.js";
import { EMOTION_ENABLED, EMOTION_MAP_EVENT } from "./emotionConfig.js";

export function processEmotionEvent(io, event) {
  if (!EMOTION_ENABLED) return;

  const map = updateStateMap(event);

  io.emit(EMOTION_MAP_EVENT, map);
}
