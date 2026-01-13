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
  console.log('[HISTE-RUNNER-DEBUG] start() called with scenario:', !!scenario, 'serverUrl:', serverUrl);
  if (isRunning) {
    console.log('[HISTE-RUNNER-DEBUG] Already running, returning');
    return;
  }
  isRunning = true;

  clearClock();

  try {
    console.log('[HISTE-RUNNER-DEBUG] About to call runScenario or startMultiHuman');
    clockInstance = scenario
      ? await runScenario({ scenario, serverUrl })
      : await startMultiHuman(serverUrl);

    console.log('[HISTE-RUNNER-DEBUG] Clock instance created:', !!clockInstance);
    if (!clockInstance) {
      isRunning = false;
    }
  } catch (error) {
    console.error('[HISTE-RUNNER-DEBUG] Error in start():', error);
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
