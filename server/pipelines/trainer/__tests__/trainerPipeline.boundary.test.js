/**
 * Dev-only boundary test for TrainerPipeline.
 * Ensures misrouted pulse/emotion/session events
 * trigger boundary warnings instead of being processed.
 *
 * Phase: 2.3.7I
 */

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { createTrainerPipeline } from "../trainerPipeline.js";

describe("TrainerPipeline boundary guard", () => {
  let ioMock;
  let builderMock;
  let warnSpy;
  let trainer;

  beforeEach(() => {
    ioMock = { emit: vi.fn() };
    builderMock = { addTrainer: vi.fn() };

    trainer = createTrainerPipeline(ioMock, builderMock);

    warnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  const forbiddenTypes = ["pulse:update", "emotion:score", "session:join"];

  test("misrouted events trigger boundary warning and do not process", () => {
    for (const type of forbiddenTypes) {
      trainer.handleTrainerAction({
        action: "nudge", // valid trainer action
        type,            // invalid routing
      });
    }

    expect(warnSpy).toHaveBeenCalledTimes(forbiddenTypes.length);

    expect(builderMock.addTrainer).not.toHaveBeenCalled();
  });
});
