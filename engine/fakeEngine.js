// engine/fakeEngine.js
// -----------------------------------------
// Fake engine that generates live pulse data
// -----------------------------------------

export function startFakeEngine(io) {
  console.log("⚙️ Fake Engine: STARTED");

  let t = 0;

  setInterval(() => {
    t += 1;

    // 4 simulated pulse channels
    const pulseValues = [
      Math.sin(t / 6) * 0.4 + 0.6, // calm channel
      Math.sin(t / 4 + 2) * 0.5 + 0.5, // stress channel
      Math.sin(t / 9 + 5) * 0.5 + 0.5, // confusion channel
      Math.random() * 0.3 + 0.7        // noise channel
    ];

    io.emit("pulse:update", {
      values: pulseValues
    });

  }, 200);
}
