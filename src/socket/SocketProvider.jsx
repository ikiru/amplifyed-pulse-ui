// src/socket/SocketProvider.jsx
import React, { useRef, useEffect, useMemo } from "react";
import io from "socket.io-client";
import { SocketContext } from "./SocketContext.jsx";

export default function SocketProvider({ children }) {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io("http://localhost:4000", {
      autoConnect: true,
      reconnection: true,
    });

    socketRef.current = socket;

    return () => socket.disconnect();
  }, []);

  const socket = socketRef.current;

  const value = useMemo(() => {
    if (!socket) return null;  // first render returns null
    return {
      socket,
      emit: (...args) => socket.emit(...args),
      on: (...args) => socket.on(...args),
      off: (...args) => socket.off(...args),
    };
  }, [socket]);

  // 🔥 STRICT-MODE fix: always provide non-null value
  const safeValue = value || {};

  return (
    <SocketContext.Provider value={safeValue}>
      {children}
    </SocketContext.Provider>
  );
}

