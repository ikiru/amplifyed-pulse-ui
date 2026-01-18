import { describe, expect, it, afterEach, vi } from "vitest";

import registerEventRouter from "../../server/routers/eventRouter.js";
import { createPulseBroadcast } from "../../server/pipelines/pulse/pulse.broadcast.js";
import { createPulseState } from "../../server/pipelines/pulse/pulse.state.js";
import { broadcastVoteUpdate } from "../../server/pipelines/message/message.vote.broadcast.js";

function createIoMock() {
  const emit = vi.fn(); // global
  const emitTo = vi.fn(); // room-scoped
  const to = vi.fn(() => ({ emit: emitTo }));
  return { emit, emitTo, to };
}

function createSocketMock(id = "socket:test") {
  const handlers = new Map();
  return {
    id,
    sessionId: "session:default",
    join: vi.fn(),
    leave: vi.fn(),
    emit: vi.fn(),
    on: vi.fn((event, handler) => {
      handlers.set(event, handler);
    }),
    _handlers: handlers,
  };
}

describe("Model A isolation: session-scoped broadcasts", () => {
  it("pulse:update is emitted to the session room (not globally) when sessionId is present", () => {
    const io = createIoMock();
    const pulseState = createPulseState();
    const pulseBroadcast = createPulseBroadcast(io, pulseState);

    // seed some state
    pulseState.setVote("session:A", "user:1", "engaged");
    pulseState.addEventLog("session:A", { userId: "user:1", value: "engaged", ts: 1 });

    pulseBroadcast.broadcastPulseUpdate("session:A", { "user:1": { actorRole: "audience" } });

    expect(io.to).toHaveBeenCalledWith("session:A");
    expect(io.emitTo).toHaveBeenCalled();
    expect(io.emit).not.toHaveBeenCalled();
  });

  it("message.vote.update is emitted to the session room (not globally) when sessionId is present", () => {
    const io = createIoMock();

    broadcastVoteUpdate({
      io,
      sessionId: "session:A",
      messageId: "m1",
      totals: { up: 1, down: 0 },
    });

    expect(io.to).toHaveBeenCalledWith("session:A");
    expect(io.emitTo).toHaveBeenCalledTimes(2);
    expect(io.emit).not.toHaveBeenCalled();
  });
});

describe("Model A gating: trainer-only events + debug passthrough guards", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousAllowDebugEmits = process.env.ALLOW_DEBUG_EMITS;

  afterEach(() => {
    process.env.NODE_ENV = previousNodeEnv;
    if (previousAllowDebugEmits === undefined) {
      delete process.env.ALLOW_DEBUG_EMITS;
    } else {
      process.env.ALLOW_DEBUG_EMITS = previousAllowDebugEmits;
    }
  });

  it("denies trainer:resolve_confusion for non-trainer sockets", () => {
    process.env.NODE_ENV = "test";
    const io = createIoMock();
    const socket = createSocketMock("socket:audience");

    const confusionPipeline = {
      handleConfusionResolution: vi.fn(),
    };
    const sessionPipeline = {
      getParticipant: () => ({ actorRole: "audience" }),
    };

    registerEventRouter(io, socket, { confusionPipeline, sessionPipeline });

    const handler = socket._handlers.get("trainer:resolve_confusion");
    expect(handler).toBeTypeOf("function");

    handler({ rootMessageId: "root1", resolutionType: "clarified" });

    expect(confusionPipeline.handleConfusionResolution).not.toHaveBeenCalled();
  });

  it("blocks debug message.state.update passthrough in production", () => {
    process.env.NODE_ENV = "production";
    const io = createIoMock();
    const socket = createSocketMock("socket:any");

    registerEventRouter(io, socket, {});

    const handler = socket._handlers.get("message.state.update");
    expect(handler).toBeTypeOf("function");

    handler({ sessionId: "session:A", messages: [] });

    expect(io.to).not.toHaveBeenCalled();
    expect(io.emit).not.toHaveBeenCalled();
  });
});

