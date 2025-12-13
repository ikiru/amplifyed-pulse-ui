import { handleSetFocus } from "./focus.handleSet.js";
import { handleClearFocus } from "./focus.handleClear.js";

export function registerFocusHandlers({ io, socket }) {
  socket.on("focus:set", ({ text }) => {
    handleSetFocus({
      io,
      sessionId: socket.sessionId,
      text,
    });
  });

  socket.on("focus:clear", () => {
    handleClearFocus({
      io,
      sessionId: socket.sessionId,
    });
  });
}
