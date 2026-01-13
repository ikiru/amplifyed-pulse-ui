// HISTE Session Discovery Helper
// Gets the active trainer session's access code for simulated participants to join

import { io } from "socket.io-client";

const DEFAULT_SESSION_ID = "session:default";
const CONNECTION_TIMEOUT_MS = 5000;

/**
 * Get the access code from the active trainer session
 * 
 * @param {string} serverUrl - Server URL to connect to
 * @param {string} sessionId - Session ID to query (defaults to session:default)
 * @returns {Promise<string>} The access code for the session
 * @throws {Error} If no active session found or connection fails
 */
export async function getTrainerSessionCode(serverUrl, sessionId = DEFAULT_SESSION_ID) {
  return new Promise((resolve, reject) => {
    const socket = io(serverUrl, {
      transports: ["websocket"],
      reconnection: false,
      timeout: CONNECTION_TIMEOUT_MS,
    });

    let timeoutId;
    let resolved = false;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      socket.off("session:metadata");
      socket.off("connect_error");
      socket.off("error");
      socket.disconnect();
    };

    const finalize = (accessCode, error) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      
      if (error) {
        reject(error);
      } else {
        resolve(accessCode);
      }
    };

    // Set timeout for connection/response
    timeoutId = setTimeout(() => {
      finalize(null, new Error(
        "Timeout waiting for session metadata. Is the trainer session active?"
      ));
    }, CONNECTION_TIMEOUT_MS);

    // Listen for session metadata response
    socket.on("session:metadata", (payload) => {
      if (payload && payload.accessCode) {
        console.log(`[HISTE] Got access code: ${payload.accessCode} for session: ${sessionId}`);
        finalize(payload.accessCode);
      } else {
        finalize(null, new Error("Session metadata received but no access code found"));
      }
    });

    // Handle connection errors
    socket.on("connect_error", (error) => {
      finalize(null, new Error(`Connection error: ${error.message}`));
    });

    socket.on("error", (error) => {
      finalize(null, new Error(`Socket error: ${error.message || error}`));
    });

    // Once connected, request session metadata
    socket.on("connect", () => {
      console.log(`[HISTE] Connected to server, requesting metadata for ${sessionId}`);
      socket.emit("session:request_metadata", { sessionId });
    });
  });
}

export default { getTrainerSessionCode };
