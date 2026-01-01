// HISTE Stage 3A Script — Multiple simulated audience participants
// Governed by:
// - docs/TESTING_ENVIRONMENTS.md
// - server/contracts/Human Interaction Stress Testing Environment (HISTE).md

import SimulationClock from "./SimulationClock.js";
import { runSimulatedAudienceMember } from "../actors/SimulatedAudienceMember.js";

const clock = new SimulationClock();
const messageTemplates = [
  "I think we might be losing the thread.",
  "Is this still the same topic as before?",
  "Can someone recap the last part?",
  "This feels like a different conversation now.",
  "I’m not sure what the point is anymore.",
];
const delays = [0, 220, 440, 660, 880];

const scheduleParticipants = (serverUrl, getAdjustments) => {
  clock.clear();
  delays.forEach((delay, index) => {
    clock.schedule(() => {
      const adjustments = typeof getAdjustments === "function" ? getAdjustments() : {};
      const tempoLabel =
        adjustments.conversationTempo >= 0.5 ? "Heated" : "Slow";
      const roomAdjustment =
        typeof adjustments.roomSize === "number"
          ? Math.max(0, adjustments.roomSize - 35)
          : 0;
      runSimulatedAudienceMember({
        messageText: `${messageTemplates[index % messageTemplates.length]} (${tempoLabel})`,
        serverUrl,
        lingerMs: 250 + roomAdjustment * 10,
      });
    }, delay);
  });
};

export function restartMultiHuman(serverUrl, getAdjustments) {
  scheduleParticipants(serverUrl, getAdjustments);
}

export default clock;
