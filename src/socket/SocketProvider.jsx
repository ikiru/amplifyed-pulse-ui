import React, { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { SocketContext } from "./SocketContext";

export default function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  useEffect(() => {
    const s = io("http://localhost:3000", {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    const handleConnect = () => {
      setConnectionStatus("connected");
    };

    const handleDisconnect = () => {
      setConnectionStatus("disconnected");
    };

    const handleError = (err) => {
      console.warn("[Socket] connection error →", err?.message);
      setConnectionStatus("error");
    };

    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);
    s.on("connect_error", handleError);

    setSocket(s);

    return () => {
      s.off("connect", handleConnect);
      s.off("disconnect", handleDisconnect);
      s.off("connect_error", handleError);
      s.disconnect();
      setSocket(null);
      setConnectionStatus("disconnected");
    };
  }, []);

  const isReady = socket && connectionStatus === "connected";

  const contextValue = useMemo(
    () => ({ socket, connectionStatus }),
    [connectionStatus, socket]
  );

  if (!isReady) {
    return null;
  }

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}
