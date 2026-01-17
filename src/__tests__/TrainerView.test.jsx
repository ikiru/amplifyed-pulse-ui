import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TrainerView from "../pages/TrainerView.jsx";
import LiveView from "../pages/LiveView.jsx";

const registeredHandlers = new Map();
let mockConnectionStatus = "connected";
const setMockConnectionStatus = (value) => {
  mockConnectionStatus = value;
};
const emitMock = vi.fn();

let mockSocket = {
  connected: true,
  sessionId: "session:default",
  id: "socket:test",
  on: vi.fn(),
  off: vi.fn(),
};

const getFirstHandler = (event) => {
  const handlers = registeredHandlers.get(event);
  return handlers?.values().next().value;
};

vi.mock("../socket/SocketContext.jsx", () => ({
  useSocket: () => ({
    socket: mockSocket,
    emit: emitMock,
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
    connectionStatus: mockConnectionStatus,
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ sessionCode: "ABCD-1234" }),
  };
});

describe("TrainerView participant counters", () => {
  beforeEach(() => {
    registeredHandlers.clear();
    emitMock.mockClear();
    setMockConnectionStatus("connected");
    mockSocket = {
      connected: true,
      sessionId: "session:default",
      id: "socket:test",
      on: vi.fn(),
      off: vi.fn(),
    };
  });

  it("waits for participant count before rendering PulseTimeline and emits no early assertions", async () => {
    const consoleAssertSpy = vi
      .spyOn(console, "assert")
      .mockImplementation(() => {});
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      setMockConnectionStatus("connecting");
      render(<TrainerView />);

      await waitFor(() => {
        expect(getFirstHandler("pulse:update")).toBeDefined();
      });

      expect(
        screen.getByText(
          /Waiting for live pulse data before drawing the timeline\./i
        )
      ).toBeInTheDocument();
      expect(consoleAssertSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      setMockConnectionStatus("connected");
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
        expect(
          screen.queryByText(
            /Waiting for live pulse data before drawing the timeline\./i
          )
        ).not.toBeInTheDocument();
      });
      expect(
        screen.queryByText(
          /Waiting for live pulse data before drawing the timeline\./i
        )
      ).not.toBeInTheDocument();
    } finally {
      consoleAssertSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      process.env.NODE_ENV = previousNodeEnv;
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
      expect(screen.getByText(/Engaged/i)).toBeInTheDocument();
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

describe("Focus Box (TrainerView)", () => {
  beforeEach(() => {
    registeredHandlers.clear();
    emitMock.mockClear();
    setMockConnectionStatus("connected");
    mockSocket = {
      connected: true,
      sessionId: "session:default",
      id: "socket:test",
      on: vi.fn(),
      off: vi.fn(),
    };
  });

  it('renders the default active focus label ("Open Conversation")', async () => {
    render(<TrainerView />);
    expect(screen.getByText(/Active:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Open Conversation/i).length).toBeGreaterThan(0);
  });

  it("emits focus:entry:add when adding a new focus (inactive by default)", async () => {
    render(<TrainerView />);

    const input = screen.getByPlaceholderText(/Enter focus statement/i);
    fireEvent.change(input, { target: { value: "Discuss objections" } });
    fireEvent.submit(input.closest("form"));

    expect(emitMock.mock.calls).toEqual(
      expect.arrayContaining([["focus:entry:add", { text: "Discuss objections" }]])
    );
  });

  it("emits focus:activate when clicking a focus entry", async () => {
    render(<TrainerView />);

    const trainerStateHandler = getFirstHandler("focus:trainer:state");
    expect(trainerStateHandler).toBeDefined();

    act(() => {
      trainerStateHandler({
        sessionId: "session:default",
        defaultFocusId: "focus:open_conversation",
        activeFocusId: "focus:open_conversation",
        entries: [
          { focusId: "focus:open_conversation", text: "Open Conversation" },
          { focusId: "focus:2", text: "Discuss objections" },
        ],
      });
    });

    fireEvent.click(screen.getByText(/Discuss objections/i));

    expect(emitMock.mock.calls).toEqual(
      expect.arrayContaining([["focus:activate", { focusId: "focus:2" }]])
    );
  });

  it("emits focus:reset_default when clicking Reset", async () => {
    render(<TrainerView />);
    fireEvent.click(screen.getByRole("button", { name: /Reset/i }));
    expect(emitMock.mock.calls).toEqual(
      expect.arrayContaining([["focus:reset_default", {}]])
    );
  });

  it("supports explicit edit modes: edit-in-place and revise-by-new", async () => {
    render(<TrainerView />);

    const trainerStateHandler = getFirstHandler("focus:trainer:state");
    act(() => {
      trainerStateHandler({
        sessionId: "session:default",
        defaultFocusId: "focus:open_conversation",
        activeFocusId: "focus:2",
        entries: [
          { focusId: "focus:open_conversation", text: "Open Conversation" },
          { focusId: "focus:2", text: "Discuss objections" },
        ],
      });
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[1]);
    const editInput = screen.getAllByRole("textbox").slice(-1)[0];
    fireEvent.change(editInput, { target: { value: "Discuss key objections" } });

    fireEvent.click(screen.getByRole("button", { name: /Save \(in place\)/i }));
    expect(emitMock.mock.calls).toEqual(
      expect.arrayContaining([
        ["focus:edit_in_place", { focusId: "focus:2", text: "Discuss key objections" }],
      ])
    );

    // Re-open and test revise-by-new
    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[1]);
    const editInput2 = screen.getAllByRole("textbox").slice(-1)[0];
    fireEvent.change(editInput2, { target: { value: "Discuss objections (revised)" } });
    fireEvent.click(screen.getByRole("button", { name: /Save as new/i }));
    expect(emitMock.mock.calls).toEqual(
      expect.arrayContaining([
        ["focus:revise_by_new", { focusId: "focus:2", text: "Discuss objections (revised)" }],
      ])
    );
  });
});

describe("LiveView focus subscriptions", () => {
  beforeEach(() => {
    registeredHandlers.clear();
    emitMock.mockClear();
    setMockConnectionStatus("connected");
    mockSocket = {
      connected: true,
      sessionId: "session:default",
      id: "socket:test",
      on: vi.fn(),
      off: vi.fn(),
    };
  });

  it("does not subscribe to focus:trainer:state (trainer-only event)", async () => {
    render(<LiveView />);
    await waitFor(() => {
      expect(getFirstHandler("focus:update")).toBeDefined();
    });
    expect(getFirstHandler("focus:trainer:state")).toBeUndefined();
  });
});
