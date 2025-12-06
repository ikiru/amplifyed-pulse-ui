import React from "react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { SocketContext } from "./SocketContext";

const SOCKET_SINGLETON_KEY = "__AMPLIFYED_PULSE_SOCKET__";

const getSharedSocket = () => {
  if (typeof globalThis === "undefined") {
    return null;
  }

  if (globalThis[SOCKET_SINGLETON_KEY]) {
    return globalThis[SOCKET_SINGLETON_KEY];
  }

  const shared = io("http://localhost:3000", {
    transports: ["websocket"],
    reconnectionAttempts: 5,
    autoConnect: false,
  });

  globalThis[SOCKET_SINGLETON_KEY] = shared;
  return shared;
};

export default function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  useEffect(() => {
    const sharedSocket = getSharedSocket();
    if (!sharedSocket) return undefined;

    const handleConnect = () => {
      setConnectionStatus("connected");
    };

    const handleDisconnect = () => {
      setConnectionStatus("disconnected");
    };

    const handleConnectError = (err) => {
      console.error("[Socket] connect_error:", err?.message);
      setConnectionStatus("error");
    };

    const handleGenericError = (err) => {
      console.error("[Socket] error:", err);
    };

    sharedSocket.on("connect", handleConnect);
    sharedSocket.on("disconnect", handleDisconnect);
    sharedSocket.on("connect_error", handleConnectError);
    sharedSocket.on("error", handleGenericError);

    if (!sharedSocket.connected && !sharedSocket.connecting) {
      sharedSocket.connect();
    }

    setSocket(sharedSocket);

    return () => {
      sharedSocket.off("connect", handleConnect);
      sharedSocket.off("disconnect", handleDisconnect);
      sharedSocket.off("connect_error", handleConnectError);
      sharedSocket.off("error", handleGenericError);
      setSocket(null);
    };
  }, []);

  const emit = useCallback(
    (event, payload) => {
      if (!socket) return;
      socket.emit(event, payload);
    },
    [socket]
  );

  const contextValue = useMemo(
    () => ({ socket, emit, connectionStatus }),
    [connectionStatus, emit, socket]
  );

  // Do NOT return null while connecting.
  // UI must stay mounted so hooks remain alive.

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}
