import { start, stop } from "../engine/histeRunner.js";

(async () => {
  await start({
    serverUrl: "http://localhost:3000",
  });

  // Scenario-based run (future use)
  // await start({
  //   scenarioPath: "testing/environments/histe/scenarios/example.json",
  // });

  setTimeout(() => {
    stop();
    process.exit(0);
  }, 45000);
})();
