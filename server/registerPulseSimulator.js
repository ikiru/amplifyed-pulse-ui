// server/registerPulseSimulator.js

export function registerPulseSimulator(io) {
  // Emit 4-channel random pulse values ~8/sec
  setInterval(() => {
    const values = [
      Math.random(),
      Math.random(),
      Math.random(),
      Math.random(),
    ];

    io.emit("pulse:update", { values });
  }, 120);
}
