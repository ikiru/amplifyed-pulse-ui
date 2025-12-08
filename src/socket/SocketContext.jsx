import React from "react";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";


export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  useEffect(() => {
    const s = io("http://localhost:3000", {
      transports: ["websocket"],
    });

    setSocket(s);

    s.on("connect", () => setConnectionStatus("connected"));
    s.on("disconnect", () => setConnectionStatus("disconnected"));

    return () => {
      s.disconnect();
    };
  }, []);

  // Standardized helper for emitting events
  const emit = useCallback((event, payload) => {
    if (!socket) return;
    socket.emit(event, payload);
  }, [socket]);

  const value = {
    socket,
    emit,
    connectionStatus,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error("useSocketContext must be used inside <SocketProvider>");
  }
  return ctx;
}
