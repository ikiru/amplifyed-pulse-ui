import React, { createContext, useEffect, useState } from "react";
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

  return s;
}

export default function SocketProvider({ children }) {
  const [socket] = useState(() => {
    const s = io("http://localhost:3000", {
      transports: ["websocket"],
    });

    return enhanceSocket(s);
  });

  useEffect(() => {
    return () => {
      socket.disconnect();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}
