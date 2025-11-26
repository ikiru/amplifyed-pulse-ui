// src/socket/useSocket.js
import { useEffect, useMemo } from "react";
import { useSocketContext } from "./SocketContext.jsx";

export default function useSocket(handlers = {}) {
  const ctx = useSocketContext();
  if (!ctx) throw new Error("useSocket must be used inside <SocketProvider>");

  const { socket, emit, on, off } = ctx;

  // Stable handlers reference
  const stableHandlers = useMemo(() => handlers, [JSON.stringify(handlers)]);

  useEffect(() => {
    if (!socket) return;

    Object.entries(stableHandlers).forEach(([event, handler]) => {
      if (handler) on(event, handler);
    });

    return () => {
      Object.entries(stableHandlers).forEach(([event, handler]) => {
        if (handler) off(event, handler);
      });
    };
  }, [socket, on, off, stableHandlers]);

  return {
    socket,
    emit,
    on,
    off,
    sendTrainerMessage: (payload) => emit("trainer:message", payload),
    sendAudienceMessage: (payload) => emit("audience:message", payload),
    sendAudienceSignal: (payload) => emit("audience:signal", payload),
    requestEngineMove: (payload) => emit("trainer:requestMove", payload),
    setFocus: (payload) => emit("trainer:setFocus", payload),
  };
}
