// engine/fakeEngine.js
export async function fakeEngine(event) {
  const { type, payload } = event;

  const responses = [];

  // 1. Trainer messages
  if (type === "trainerMessage") {
    responses.push({
      type: "move",
      move: "reflect",
      reasoning: "Trainer message acknowledged in simulation mode."
    });

    responses.push({
      type: "pulse",
      values: randomPulse()
    });
  }

  // 2. Audience messages
  if (type === "audienceMessage") {
    responses.push({
      type: "pulse",
      values: randomPulse()
    });
  }

  // 3. Audience signals
  if (type === "audienceSignal") {
    responses.push({
      type: "move",
      move: "nudge",
      reasoning: "Audience signal triggered a nudge."
    });

    responses.push({
      type: "pulse",
      values: randomPulse()
    });
  }

  // 4. Trainer focus
  if (type === "trainerFocus") {
    responses.push({
      type: "focus",
      activeTurnId: payload.targetTurnId
    });
  }

  // 5. Move request
  if (type === "moveRequest") {
    responses.push({
      type: "move",
      move: payload.requestedMove,
      reasoning: "Simulated move returned by fake engine."
    });
  }

  return responses;
}

function randomPulse() {
  return Array.from({ length: 4 }, () => Number((Math.random() * 0.9 + 0.1).toFixed(2)));
}
