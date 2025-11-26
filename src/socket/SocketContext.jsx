// src/socket/SocketContext.jsx
import { createContext, useContext } from "react";

export const SocketContext = createContext(null);

export function useSocketContext() {
  return useContext(SocketContext);
}
