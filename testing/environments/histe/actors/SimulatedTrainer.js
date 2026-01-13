// SimulatedTrainer.js
// Governed by HISTE contract - interacts only as a real trainer would
// Provides trainer-role socket connection for HISTE scenarios

import { io } from "socket.io-client";

/**
 * SimulatedTrainer
 * 
 * Represents a simulated trainer participant in HISTE testing scenarios.
 * Connects to the server with trainer role permissions to enable focus
 * management and other trainer-specific actions.
 * 
 * Contract Compliance:
 * - Joins session using standard session:join event (no privileged paths)
 * - Uses trainer role to gain focus management permissions
 * - Interacts through same socket events as real trainers
 */
export class SimulatedTrainer {
  constructor({ serverUrl, sessionId }) {
    this.socket = null;
    this.serverUrl = serverUrl;
    this.sessionId = sessionId;
    this.isConnected = false;
  }

  /**
   * Connect trainer socket to server
   * 
   * @returns {Promise<void>} Resolves when connected and joined
   * @throws {Error} If connection fails
   */
  async connect() {
    return new Promise((resolve, reject) => {
      this.socket = io(this.serverUrl, {
        transports: ["websocket"],
        reconnection: false,
      });

      const cleanup = () => {
        this.socket.off("connect", handleConnect);
        this.socket.off("connect_error", handleError);
        this.socket.off("error", handleError);
      };

      const handleConnect = () => {
        cleanup();
        
        // Join session with trainer role
        // This is the same event a real trainer would use
        this.socket.emit("session:join", {
          sessionId: this.sessionId,
          role: "trainer", // Request trainer permissions
          name: "HISTE Trainer",
          metadata: {
            source: "histe-simulation",
          },
        });

        this.isConnected = true;
        console.log(`[SimulatedTrainer] Connected as trainer to ${this.sessionId}`);
        resolve();
      };

      const handleError = (err) => {
        cleanup();
        this.isConnected = false;
        reject(err);
      };

      this.socket.once("connect", handleConnect);
      this.socket.once("connect_error", handleError);
      this.socket.once("error", handleError);
    });
  }

  /**
   * Disconnect trainer socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log("[SimulatedTrainer] Disconnected");
    }
  }

  /**
   * Get the underlying socket instance
   * Used by runScenario to emit focus events
   * 
   * @returns {Socket|null} Socket.IO socket instance
   */
  getSocket() {
    return this.socket;
  }

  /**
   * Check if trainer is connected
   * 
   * @returns {boolean} True if connected
   */
  isConnected() {
    return this.isConnected && this.socket !== null;
  }
}
