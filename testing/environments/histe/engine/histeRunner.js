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

const startMultiHuman = (serverUrl, getAdjustments) => {
  if (typeof restartMultiHuman === "function") {
    restartMultiHuman(serverUrl, getAdjustments);
  }
  return clock;
};

export async function start({ scenario, serverUrl, getAdjustments } = {}) {
  if (isRunning) return;
  isRunning = true;

  clearClock();

  try {
    clockInstance = scenario
      ? await runScenario({ scenario, serverUrl, getAdjustments })
      : await startMultiHuman(serverUrl, getAdjustments);

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

export function pause() {
  if (!isRunning || !clockInstance) return;
  if (typeof clockInstance.pause === "function") {
    clockInstance.pause();
  }
}

export function resume() {
  if (!isRunning || !clockInstance) return;
  if (typeof clockInstance.resume === "function") {
    clockInstance.resume();
  }
}
