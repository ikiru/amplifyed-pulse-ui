import React, { createContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

export const SocketContext = createContext(null);
export const handlers = {};

function enhanceSocket(s) {
  if (!s) return s;

  if (!s.listen) {
    s.listen = (event, listener) => {
      s.on(event, listener);
      return () => {
        s.off(event, listener);
      };
    };
  }

  s.on("message:update", (payload) => {
    handlers["message:update"]?.(payload);
  });

  // Forward pulse pipeline updates to the client
  s.on("pulse:update", (payload) => {
    handlers["pulse:update"]?.(payload);
  });

  // ⭐ NEW FIX — Forward enriched moment updates to the client
  s.on("moment:update", (payload) => {
    handlers["moment:update"]?.(payload);
  });

  return s;
}

export default function SocketProvider({ children }) {
  const [socket] = useState(() => {
    const s = io("http://localhost:3000", {
      transports: ["websocket"],
    });

    return enhanceSocket(s);
  });
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  useEffect(() => {
    return () => {
      socket.disconnect();
    };
  }, [socket]);

  useEffect(() => {
    const handleConnect = () => {
      setConnectionStatus("connected");
    };

    const handleDisconnect = () => {
      setConnectionStatus("disconnected");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket]);

  const contextValue = useMemo(
    () => ({ socket, connectionStatus }),
    [socket, connectionStatus]
  );

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}
