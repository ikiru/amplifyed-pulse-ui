// src/socket/useSocket.js
import { useContext, useEffect } from "react";
import { SocketContext } from "./SocketContext.jsx";

// Shared socket hook: wires optional event handlers and exposes the socket instance.
export function useSocket(eventHandlers = {}) {
  const socket = useContext(SocketContext);

  useEffect(() => {
    if (!socket) return;

    const cleanups = Object.entries(eventHandlers).map(([event, handler]) => {
      if (typeof handler !== "function") return null;
      socket.on(event, handler);
      return () => socket.off(event, handler);
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup && cleanup());
    };
  }, [socket, eventHandlers]);

  return socket;
}

export default useSocket;
