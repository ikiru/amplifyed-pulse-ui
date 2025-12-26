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

  return {
    handleSetFocus,
    handleClearFocus,
    getActiveFocus,
  };
}
