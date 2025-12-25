import "@testing-library/jest-dom";
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TrainerView from "../pages/TrainerView.jsx";

const registeredHandlers = new Map();

const getFirstHandler = (event) => {
  const handlers = registeredHandlers.get(event);
  return handlers?.values().next().value;
};

vi.mock("../socket/SocketContext.jsx", () => ({
  useSocket: () => ({
    emit: vi.fn(),
    onEvent: (event, handler) => {
      const handlers = registeredHandlers.get(event) ?? new Set();
      handlers.add(handler);
      registeredHandlers.set(event, handlers);
    },
    offEvent: (event, handler) => {
      const handlers = registeredHandlers.get(event);
      if (!handlers) return;
      handlers.delete(handler);
      if (handlers.size === 0) {
        registeredHandlers.delete(event);
      }
    },
    connectionStatus: "connected",
  }),
}));

describe("TrainerView participant counters", () => {
  beforeEach(() => {
    registeredHandlers.clear();
  });

  it("waits for participant count before rendering PulseTimeline and emits no early assertions", async () => {
    const consoleAssertSpy = vi
      .spyOn(console, "assert")
      .mockImplementation(() => {});
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      render(<TrainerView />);

      await waitFor(() => {
        expect(getFirstHandler("pulse:update")).toBeDefined();
      });

      expect(
        screen.getByText(
          /Waiting for canonical participant data before drawing the timeline\./i
        )
      ).toBeInTheDocument();
      expect(consoleAssertSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      const pulseUpdateHandler = getFirstHandler("pulse:update");
      act(() => {
        pulseUpdateHandler({
          participantCount: 1,
          participants: { a: { actorRole: "audience" } },
          votes: {},
          eventLog: [],
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/Room:/i)).toBeInTheDocument();
      });
      expect(
        screen.queryByText(
          /Waiting for canonical participant data before drawing the timeline\./i
        )
      ).not.toBeInTheDocument();
    } finally {
      consoleAssertSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    }
  });

  it("renders zeroed PulseSummary when no audience exists", async () => {
    render(<TrainerView />);

    await waitFor(() => {
      expect(getFirstHandler("pulse:update")).toBeDefined();
    });

    const pulseUpdateHandler = getFirstHandler("pulse:update");
    act(() => {
      pulseUpdateHandler({
        participants: { a: { actorRole: "trainer" } },
        votes: { a: "engaged" },
        eventLog: [],
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Room:/i)).toBeInTheDocument();
    });

    const engagedValue = screen
      .getByText(/Engaged/i)
      .nextElementSibling?.textContent?.trim();
    const neutralValue = screen
      .getByText(/Neutral/i)
      .nextElementSibling?.textContent?.trim();
    const frustratedValue = screen
      .getByText(/Frustrated/i)
      .nextElementSibling?.textContent?.trim();

    expect(engagedValue).toBe("0");
    expect(neutralValue).toBe("0");
    expect(frustratedValue).toBe("0");
  });
});
