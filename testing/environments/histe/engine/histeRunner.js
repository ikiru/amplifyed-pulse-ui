import { runScenario } from "./runScenario.js";
import clock, { restartMultiHuman } from "./multiHumanTest.js";

let clockInstance = null;
let isRunning = false;

const clearClock = () => {
  if (clockInstance && typeof clockInstance.clear === "function") {
    clockInstance.clear();
  }
  clockInstance = null;
};

const startMultiHuman = (serverUrl) => {
  if (typeof restartMultiHuman === "function") {
    restartMultiHuman(serverUrl);
  }
  return clock;
};

export async function start({ scenario, serverUrl } = {}) {
  if (isRunning) return;
  isRunning = true;

  clearClock();

  try {
    clockInstance = scenario
      ? await runScenario(scenario, serverUrl)
      : await startMultiHuman(serverUrl);

    if (!clockInstance) {
      isRunning = false;
    }
  } catch (error) {
    isRunning = false;
    throw error;
  }
}

export function stop() {
  if (!isRunning) return;
  clearClock();
  isRunning = false;
}
