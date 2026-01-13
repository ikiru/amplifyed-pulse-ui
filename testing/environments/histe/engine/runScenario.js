// HISTE Stage 4 Script — Scenario message execution loop
// Governed by:
// - docs/TESTING_ENVIRONMENTS.md
// - server/contracts/Human Interaction Stress Testing Environment (HISTE).md

import { io } from "socket.io-client";
import SimulationClock from "./SimulationClock.js";
import { SimulatedTrainer } from "../actors/SimulatedTrainer.js";

const DEFAULT_SERVER_URL = "http://localhost:3000";
const DEFAULT_SESSION_ID = "session:default";

const createSocket = (serverUrl, sessionId) =>
  io(serverUrl, {
    transports: ["websocket"],
    reconnection: false,
  }).on("connect", function handleConnect() {
    this.emit("session:join", { sessionId });
  });

export function runScenario({ scenario = {}, serverUrl, getAdjustments } = {}) {
  const clock = new SimulationClock();
  const resolvedServerUrl = serverUrl ?? DEFAULT_SERVER_URL;
  const sessionId =
    typeof scenario.sessionId === "string" ? scenario.sessionId : DEFAULT_SESSION_ID;

  const participants = Array.isArray(scenario.participants)
    ? scenario.participants.filter((entry) => entry?.id)
    : [];
  if (participants.length === 0) {
    throw new Error("HISTE scenario requires at least one participant with an id.");
  }
  const participantIds = new Set();
  for (const participant of participants) {
    if (typeof participant.id !== "string" || participant.id.trim() === "") {
      throw new Error("HISTE participant id must be a non-empty string.");
    }
    participantIds.add(participant.id);
  }
  const sockets = new Map();
  
  // Create trainer socket for focus events
  let trainerSocket = null;
  const trainer = new SimulatedTrainer({
    serverUrl: resolvedServerUrl,
    sessionId,
  });

  const disconnectAll = () => {
    sockets.forEach((socket) => {
      if (socket && typeof socket.disconnect === "function") {
        socket.disconnect();
      }
    });
    sockets.clear();
    
    // Disconnect trainer socket
    if (trainer) {
      trainer.disconnect();
      trainerSocket = null;
    }
  };

  const validateScenarioTopology = (messages) => {
    const seenIds = new Set();
    for (const message of messages) {
      const messageId = message?.id;
      if (!messageId) {
        throw new Error("HISTE scenario message missing required \"id\".");
      }
      const threadId = message.threadId;
      if (threadId && !seenIds.has(threadId)) {
        throw new Error(
          `HISTE scenario message "${messageId}" references unknown threadId "${threadId}".`
        );
      }
      seenIds.add(messageId);
    }
  };

  const connectParticipant = (participant) =>
    new Promise((resolve) => {
      const socket = createSocket(resolvedServerUrl, sessionId);

      const cleanup = () => {
        socket.off("connect_error", handleError);
        socket.off("error", handleError);
      };

      const handleConnect = () => {
        cleanup();
        sockets.set(participant.id, socket);
        resolve();
      };

      const handleError = () => {
        cleanup();
        resolve();
      };

      socket.once("connect", handleConnect);
      socket.once("connect_error", handleError);
      socket.once("error", handleError);
    });

  const messages = Array.isArray(scenario.messages) ? scenario.messages : [];
  if (messages.length === 0) {
    throw new Error("HISTE scenario requires at least one message.");
  }
  validateScenarioTopology(messages);
  for (const message of messages) {
    if (!participantIds.has(message.from)) {
      throw new Error(
        `HISTE message refers to unknown participant "${message.from}".`
      );
    }
  }

  const getLatestAdjustments = () => {
    if (typeof getAdjustments === "function") {
      return getAdjustments();
    }
    return {};
  };

  /**
   * Schedule focus events from scenario
   * Focus events are emitted by the trainer socket
   */
  const scheduleFocusEvents = () => {
    const focusEvents = Array.isArray(scenario.focusEvents) ? scenario.focusEvents : [];
    
    if (focusEvents.length === 0) {
      return; // No focus events to schedule
    }

    if (!trainerSocket) {
      console.warn("[HISTE] No trainer socket available for focus events");
      return;
    }
    
    focusEvents.forEach((event) => {
      const delay = Math.max(0, typeof event.delayMs === "number" ? event.delayMs : 0);
      
      clock.schedule(() => {
        if (!trainerSocket) {
          console.warn("[HISTE] Trainer socket unavailable at scheduled focus event time");
          return;
        }
        
        if (event.action === "set" && event.text) {
          console.log(`[HISTE] Setting focus: "${event.text}"`);
          trainerSocket.emit("focus:set", { 
            sessionId,
            text: event.text 
          });
        } else if (event.action === "clear") {
          console.log(`[HISTE] Clearing focus`);
          trainerSocket.emit("focus:clear", { sessionId });
        } else {
          console.warn("[HISTE] Invalid focus event:", event);
        }
      }, delay);
    });
  };

  const scheduleMessages = () => {
    messages.forEach((message) => {
      const delay = Math.max(0, typeof message.delayMs === "number" ? message.delayMs : 0);

      clock.schedule(() => {
        const participantId = message.from;
        const socket = sockets.get(participantId);
        if (!socket) {
          throw new Error(`HISTE socket missing for participant ${participantId}.`);
        }

        const text = String(message.text ?? "");
        console.log(
          `[HISTE] Emitting message from ${participantId}: "${text}"`
        );
        socket.emit("message:audience", {
          messageId: message.id,
          text,
          parentMessageId:
            typeof message.threadId === "string" && message.threadId.trim() !== ""
              ? message.threadId
              : null,
        });
      }, delay);
    });
  };

  // Connect trainer first, then participants
  const initPromise = Promise.all([
    trainer.connect().then(() => {
      trainerSocket = trainer.getSocket();
      console.log("[HISTE] Trainer connected successfully");
    }).catch((err) => {
      console.error("[HISTE] Failed to connect trainer:", err);
      // Continue without trainer - focus events will be skipped
    }),
    ...participants.map((p) => connectParticipant(p))
  ]);

  // After all connections, schedule events
  initPromise.then(() => {
    scheduleFocusEvents(); // Schedule focus events first
    scheduleMessages();     // Then schedule messages
  });

  return {
    clear() {
      clock.clear();
      disconnectAll();
    },
    pause() {
      clock.pause();
    },
    resume() {
      clock.resume();
    },
  };
}

export default { runScenario };

function connectParticipantPromises(list, connectFn) {
  return Promise.all(list.map((participant) => connectFn(participant)));
}
