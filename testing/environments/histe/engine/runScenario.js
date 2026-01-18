// HISTE Stage 4 Script — Scenario message execution loop
// Governed by:
// - docs/TESTING_ENVIRONMENTS.md
// - server/contracts/Human Interaction Stress Testing Environment (HISTE).md

import { io } from "socket.io-client";
import SimulationClock from "./SimulationClock.js";
import { SimulatedTrainer } from "../actors/SimulatedTrainer.js";
import { getTrainerSessionCode } from "./sessionDiscovery.js";

const DEFAULT_SERVER_URL = "http://localhost:3000";
const DEFAULT_SESSION_ID = "session:default";

const createSocket = (serverUrl, accessCode) =>
  io(serverUrl, {
    transports: ["websocket"],
    reconnection: false,
  }).on("connect", function handleConnect() {
    console.log('[HISTE-DEBUG] createSocket connected, emitting session:join with accessCode:', accessCode, 'socketId:', this.id);
    console.log('[HISTE-DIAG] Socket connected, joining with accessCode:', accessCode, 'socketId:', this.id);
    
    // Listen for join success
    this.once("session:joined", (payload) => {
      console.log('[HISTE-DIAG] ✅ Participant joined successfully:', payload);
    });
    
    // Listen for join failure
    this.once("session:error", (error) => {
      console.error('[HISTE-DIAG] ❌ Participant join FAILED:', error);
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4231279e-6952-4b85-bc1a-061d94f40485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'runScenario.js:18',message:'createSocket emitting session:join',data:{accessCode,socketId:this.id,role:'audience'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    this.emit("session:join", { accessCode, role: 'audience' });
  });

export async function runScenario({ scenario = {}, serverUrl } = {}) {
  console.log('[HISTE-DEBUG] runScenario called with:', { 
    participantCount: scenario.participants?.length,
    messageCount: scenario.messages?.length,
    hasFocusEvents: !!scenario.focusEvents
  });
  const clock = new SimulationClock();
  const resolvedServerUrl = serverUrl ?? DEFAULT_SERVER_URL;
  const sessionId =
    typeof scenario.sessionId === "string" ? scenario.sessionId : DEFAULT_SESSION_ID;

  // Get the access code from the active trainer session
  console.log('[HISTE] Getting access code from session:', sessionId);
  let accessCode;
  try {
    accessCode = await getTrainerSessionCode(resolvedServerUrl, sessionId);
    console.log('[HISTE] Successfully got access code:', accessCode);
    console.log('[HISTE-DIAG] Access code retrieved:', accessCode);
  } catch (error) {
    console.error('[HISTE] Failed to get access code:', error.message);
    throw new Error(`HISTE requires an active trainer session. Please open TrainerView first. Error: ${error.message}`);
  }

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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4231279e-6952-4b85-bc1a-061d94f40485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'runScenario.js:81',message:'connectParticipant called',data:{participantId:participant.id,accessCode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const socket = createSocket(resolvedServerUrl, accessCode);

      const cleanup = () => {
        socket.off("connect_error", handleError);
        socket.off("error", handleError);
      };

      const handleConnect = () => {
        console.log('[HISTE-DEBUG] participant socket connected:', participant.id, 'socketId:', socket.id);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/4231279e-6952-4b85-bc1a-061d94f40485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'runScenario.js:90',message:'participant socket connected',data:{participantId:participant.id,socketId:socket.id,sessionId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        cleanup();
        sockets.set(participant.id, socket);
        resolve();
      };

      const handleError = (err) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/4231279e-6952-4b85-bc1a-061d94f40485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'runScenario.js:96',message:'participant socket connection error',data:{participantId:participant.id,error:String(err),sessionId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
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

  /**
   * Schedule focus events from scenario
   * Focus events are emitted by the trainer socket
   */
  const scheduleFocusEvents = () => {
    const focusEvents = Array.isArray(scenario.focusEvents) ? scenario.focusEvents : [];
    
    console.log('[HISTE-DIAG] Scheduling', focusEvents.length, 'focus events');
    console.log('[HISTE-DIAG] Focus events:', focusEvents);
    
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
          console.log('[HISTE-DIAG] Emitting focus at', delay, 'ms:', event);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/4231279e-6952-4b85-bc1a-061d94f40485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'runScenario.js:152',message:'emitting focus:set',data:{text:event.text,sessionId,socketId:trainerSocket?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          trainerSocket.emit("focus:set", { 
            sessionId,
            text: event.text 
          });
        } else if (event.action === "clear") {
          console.log(`[HISTE] Clearing focus`);
          console.log('[HISTE-DIAG] Emitting focus clear at', delay, 'ms:', event);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/4231279e-6952-4b85-bc1a-061d94f40485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'runScenario.js:158',message:'emitting focus:clear',data:{sessionId,socketId:trainerSocket?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          trainerSocket.emit("focus:clear", { sessionId });
        } else {
          console.warn("[HISTE] Invalid focus event:", event);
        }
      }, delay);
    });
  };

  /**
   * Schedule pulse events from scenario
   * Pulse events are emitted by participant sockets
   * Values: -1 (frustrated), 0 (neutral), 1 (engaged)
   */
  const schedulePulseEvents = () => {
    const pulseEvents = Array.isArray(scenario.pulseEvents) ? scenario.pulseEvents : [];
    
    console.log('[HISTE-DIAG] Scheduling', pulseEvents.length, 'pulse events');
    console.log('[HISTE-DIAG] Pulse events:', pulseEvents);
    
    if (pulseEvents.length === 0) {
      return; // No pulse events to schedule
    }
    
    pulseEvents.forEach((event) => {
      const delay = Math.max(0, typeof event.delayMs === "number" ? event.delayMs : 0);
      
      clock.schedule(() => {
        const participantId = event.participantId || event.from;
        const socket = sockets.get(participantId);
        
        if (!socket) {
          console.warn(`[HISTE] No socket for participant ${participantId} - skipping pulse event`);
          return;
        }
        
        const pulseValue = typeof event.value === "number" ? event.value : 0;
        
        // Validate pulse value
        if (pulseValue < -1 || pulseValue > 1) {
          console.warn(`[HISTE] Invalid pulse value ${pulseValue} - must be -1, 0, or 1`);
          return;
        }
        
        const emotionLabel = pulseValue === 1 ? "engaged" : pulseValue === -1 ? "frustrated" : "neutral";
        console.log(`[HISTE] ${participantId} submitting pulse: ${pulseValue} (${emotionLabel})`);
        
        socket.emit("audience:pulse", { pulse: emotionLabel });
      }, delay);
    });
  };

  /**
   * Schedule self-report events from scenario
   * Self reports are emitted by participant sockets via the real audience path.
   * Currently supported: { type: "off_focus", messageId }
   */
  const scheduleSelfReportEvents = () => {
    const selfReportEvents = Array.isArray(scenario.selfReportEvents)
      ? scenario.selfReportEvents
      : [];

    console.log(
      "[HISTE-DIAG] Scheduling",
      selfReportEvents.length,
      "self report events"
    );
    if (selfReportEvents.length === 0) {
      return;
    }

    selfReportEvents.forEach((event) => {
      const delay = Math.max(0, typeof event.delayMs === "number" ? event.delayMs : 0);

      clock.schedule(() => {
        const participantId = event.from ?? event.participantId;
        const socket = sockets.get(participantId);

        if (!socket) {
          console.warn(
            `[HISTE] No socket for participant ${participantId} - skipping self report event`
          );
          return;
        }

        const type = typeof event.type === "string" ? event.type : "";
        const messageId =
          typeof event.messageId === "string" ? event.messageId : null;

        if (!messageId) {
          console.warn("[HISTE] Self report event missing messageId", event);
          return;
        }

        if (type !== "off_focus") {
          console.warn(
            `[HISTE] Unsupported self report type "${type}" - only "off_focus" is supported`
          );
          return;
        }

        socket.emit("self-report:signal", {
          type,
          messageId,
          sessionId,
          ts: Date.now(),
        });
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
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/4231279e-6952-4b85-bc1a-061d94f40485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'runScenario.js:174',message:'socket missing for participant',data:{participantId,messageId:message.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          throw new Error(`HISTE socket missing for participant ${participantId}.`);
        }

        const text = String(message.text ?? "");
        console.log(
          `[HISTE] Emitting message from ${participantId}: "${text}"`
        );
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/4231279e-6952-4b85-bc1a-061d94f40485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'runScenario.js:182',message:'emitting message:audience',data:{participantId,messageId:message.id,text:text.substring(0,50),socketId:socket.id,threadId:message.threadId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/4231279e-6952-4b85-bc1a-061d94f40485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'runScenario.js:195',message:'starting connections',data:{participantCount:participants.length,sessionId,hasFocusEvents:Array.isArray(scenario.focusEvents)&&scenario.focusEvents.length>0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const initPromise = Promise.all([
    trainer.connect().then(() => {
      trainerSocket = trainer.getSocket();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4231279e-6952-4b85-bc1a-061d94f40485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'runScenario.js:197',message:'trainer connected',data:{sessionId,socketId:trainerSocket?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.log("[HISTE] Trainer connected successfully");
    }).catch((err) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4231279e-6952-4b85-bc1a-061d94f40485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'runScenario.js:200',message:'trainer connection failed',data:{error:String(err),sessionId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.error("[HISTE] Failed to connect trainer:", err);
      // Continue without trainer - focus events will be skipped
    }),
    ...participants.map((p) => connectParticipant(p))
  ]);

  // After all connections, schedule events
  initPromise.then(() => {
    console.log('[HISTE-DEBUG] All connections complete. Sockets:', sockets.size, 'Has trainer:', !!trainerSocket);
    console.log('[HISTE-DIAG] All sockets connected. Map size:', sockets.size);
    console.log('[HISTE-DIAG] Socket IDs:', Array.from(sockets.keys()));
    console.log('[HISTE-DIAG] Trainer socket exists:', !!trainerSocket);
    console.log('[HISTE-DIAG] Trainer socket ID:', trainerSocket?.id);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4231279e-6952-4b85-bc1a-061d94f40485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'runScenario.js:207',message:'all connections complete',data:{socketsCount:sockets.size,hasTrainerSocket:!!trainerSocket,sessionId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    scheduleFocusEvents(); // Schedule focus events first
    schedulePulseEvents(); // Schedule pulse votes
    scheduleSelfReportEvents(); // Optional self reports (e.g., off_focus)
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
