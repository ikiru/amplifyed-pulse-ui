// HISTE Stage 3A Script — Multiple simulated audience participants
// Governed by:
// - docs/testing-environments.md
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

const scheduleParticipants = (serverUrl) => {
  clock.clear();
  delays.forEach((delay, index) => {
    clock.schedule(() => {
      runSimulatedAudienceMember({
        messageText: messageTemplates[index % messageTemplates.length],
        serverUrl,
        lingerMs: 250,
      });
    }, delay);
  });
};

export function restartMultiHuman(serverUrl) {
  scheduleParticipants(serverUrl);
}

export default clock;
