import { useContext, useCallback } from "react";
import { SocketContext, handlers } from "./SocketProvider.jsx";

export function useSocket() {
  const context = useContext(SocketContext);

  if (!context || !context.socket) {
    throw new Error("useSocket must be used inside <SocketProvider>");
  }

  const { socket, connectionStatus } = context;

  // Register a handler for a specific event
  const onEvent = useCallback((event, fn) => {
    handlers[event] = fn;
    return () => {
      if (handlers[event] === fn) {
        delete handlers[event];
      }
    };
  }, []);

  // Unregister handler explicitly
  const offEvent = useCallback((event, fn) => {
    if (handlers[event] === fn) {
      delete handlers[event];
    }
  }, []);

  return {
    socket,
    connectionStatus,
    onEvent,
    offEvent,
  };
}
