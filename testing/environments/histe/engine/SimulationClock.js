// HISTE Stage 2 Utility — Simulation Clock
// Governed by:
// - docs/testing-environments.md
// - server/contracts/Human Interaction Stress Testing Environment (HISTE).md
//
// Provides deterministic scheduling for simulated actors. It can pause,
// resume, and cancel queued callbacks without relying on runtime globals.

export default class SimulationClock {
  #tasks = new Set();
  #paused = false;

  schedule(callback, delayMs = 0) {
    if (typeof callback !== "function") {
      throw new Error("SimulationClock schedule requires a callback.");
    }

    const task = {
      callback,
      remaining: Math.max(0, delayMs),
      timerId: null,
      startTime: null,
    };

    const startTimer = () => {
      task.startTime = Date.now();
      task.timerId = setTimeout(() => this.#execute(task), task.remaining);
    };

    if (!this.#paused) {
      startTimer();
    }

    this.#tasks.add(task);
    return task;
  }

  pause() {
    if (this.#paused) return;
    this.#paused = true;

    for (const task of this.#tasks) {
      if (task.timerId) {
        clearTimeout(task.timerId);
        const elapsed = Date.now() - (task.startTime ?? 0);
        task.remaining = Math.max(task.remaining - Math.max(elapsed, 0), 0);
        task.timerId = null;
      }
    }
  }

  resume() {
    if (!this.#paused) return;
    this.#paused = false;

    for (const task of Array.from(this.#tasks)) {
      if (!task.timerId) {
        task.startTime = Date.now();
        task.timerId = setTimeout(() => this.#execute(task), task.remaining);
      }
    }
  }

  clear() {
    for (const task of this.#tasks) {
      if (task.timerId) {
        clearTimeout(task.timerId);
      }
    }
    this.#tasks.clear();
    this.#paused = false;
  }

  #execute(task) {
    this.#tasks.delete(task);
    task.timerId = null;
    task.callback();
  }
}
