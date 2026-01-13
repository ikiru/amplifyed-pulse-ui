import { handleSetFocus as runHandleSetFocus } from "./focus.handleSet.js";
import { handleClearFocus as runHandleClearFocus } from "./focus.handleClear.js";
import { getActiveFocus } from "./focus.state.js";

export function registerFocusHandlers({ io } = {}) {
  function handleSetFocus(payload = {}) {
    return runHandleSetFocus({
      io,
      ...payload,
    });
  }

  function handleClearFocus(payload = {}) {
    return runHandleClearFocus({
      io,
      ...payload,
    });
  }

  /**
   * Sync focus state to a specific socket (for join/rejoin)
   * 
   * @param {Object} socket - Socket.IO socket instance
   * @param {string} sessionId - Session identifier
   */
  function syncFocusState(socket, sessionId) {
    if (!socket || !sessionId) {
      return;
    }

    const focusState = getActiveFocus(sessionId);
    
    if (focusState) {
      socket.emit('focus:update', {
        sessionId,
        focus: focusState,
      });
    }
  }

  return {
    handleSetFocus,
    handleClearFocus,
    getActiveFocus,
    syncFocusState,
  };
}
