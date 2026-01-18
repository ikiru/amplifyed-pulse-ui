import basicNormalRoom from "./basic-normal-room.json";
import fastRoom from "./fast-room.json";
import normalRoom from "./normal-room.json";
import overlappingQuestions from "./overlapping-questions.json";
import slowRoom from "./slow-room.json";
import focusShiftRoom from "./focus-shift-room.json";
import realWorldMultiThread100 from "./real-world-multi-thread-100.json";
import threadToolsLargeActiveSelfreport108 from "./thread-tools-large-active-selfreport-108.json";

const normalize = (json, source) => ({
  id: json.id ?? json.name ?? `${source}-${Math.random().toString(36).slice(2, 8)}`,
  name: json.name ?? "Unnamed Scenario",
  participantsRange: json.participantsRange ?? "N/A",
  tempo: json.tempo ?? "Unknown",
  flow: json.flow ?? "Varied",
  surfacing: json.surfacing ?? "Unknown",
  json,
  source,
});

export const OFFICIAL_SCENARIOS = [
  basicNormalRoom,
  realWorldMultiThread100,
  threadToolsLargeActiveSelfreport108,
  normalRoom,
  overlappingQuestions,
  slowRoom,
  focusShiftRoom,
].map((json) => normalize(json, "official"));
