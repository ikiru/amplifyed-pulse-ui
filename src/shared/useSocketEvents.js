// src/shared/useSocketEvents.js
import { useEffect, useContext } from "react";
import { SocketContext } from "../socket/SocketContext.jsx";

export function useSocketEvents(handlers = {}) {
  const socketCtx = useContext(SocketContext);

  useEffect(() => {
    if (!socketCtx?.socket) return;

    const socket = socketCtx.socket;

    // register handlers
    for (const [eventName, handler] of Object.entries(handlers)) {
      socket.on(eventName, handler);
    }

    // cleanup
    return () => {
      for (const [eventName, handler] of Object.entries(handlers)) {
        socket.off(eventName, handler);
      }
    };
  }, [socketCtx?.socket, handlers]);
}
