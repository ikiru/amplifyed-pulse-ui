// HISTE Stage 1 Actor — Simulated Audience Member
// Governed by:
// - docs/testing-environments.md
// - server/contracts/Human Interaction Stress Testing Environment (HISTE).md
//
// This actor may ONLY interact with the system via the public audience socket
// surface. It joins sessions and submits messages exactly like a real audience
// member before disconnecting.

import { io } from "socket.io-client";

const DEFAULT_SESSION_ID = "session:default";
const DEFAULT_MESSAGE_TEXT = "Simulated audience participant message.";
const DEFAULT_LINGER_MS = 250;
const DEFAULT_SERVER_URL = "http://localhost:3000";

function cleanupSocket(socket, handlers) {
  handlers.forEach(([event, handler]) => {
    socket.off(event, handler);
  });
}

export async function runSimulatedAudienceMember({
  sessionId = DEFAULT_SESSION_ID,
  messageText = DEFAULT_MESSAGE_TEXT,
  focus = null,
  parentMessageId = null,
  messageId = null,
  lingerMs = DEFAULT_LINGER_MS,
  socketUrl = DEFAULT_SERVER_URL,
  socketOptions = {},
} = {}) {
  if (!socketUrl) {
    throw new Error("HISTE configuration error: serverUrl is required");
  }

  const socket = io(socketUrl, {
    transports: ["websocket"],
    reconnection: false,
    ...socketOptions,
  });

  return new Promise((resolve, reject) => {
    const handlers = [];
    const finalize = (result, error) => {
      cleanupSocket(socket, handlers);
      socket.disconnect();
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    };

    const handleConnect = () => {
      console.log(
        "[HISTE] Connected simulated audience member to",
        socketUrl
      );
      socket.emit("session:join", { sessionId });
      socket.emit("message:audience", {
        ...(messageId ? { messageId } : {}),
        text: messageText,
        focus,
        parentMessageId,
      });
      setTimeout(() => finalize(), lingerMs);
    };

    const handleError = (error) => finalize(null, error);

    handlers.push(["connect", handleConnect]);
    handlers.push(["connect_error", handleError]);
    handlers.push(["error", handleError]);

    handlers.forEach(([event, handler]) => socket.once(event, handler));
  });
}

export default runSimulatedAudienceMember;
