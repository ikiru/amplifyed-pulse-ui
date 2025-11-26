// src/pages/TrainerView.jsx

import React, { useState } from "react";
import useSocket from "../socket/useSocket";

import MessageStream from "../console/MessageStream";
import InterpreterPanel from "../console/InterpreterPanel";
import MoveToolkit from "../console/MoveToolkit";
import FocusOverlay from "../console/FocusOverlay";
import SignalDeck from "../console/SignalDeck";

export default function TrainerView() {
  const [messages, setMessages] = useState([]);
  const [engineMove, setEngineMove] = useState(null);
  const [focus, setFocus] = useState(null);

  const socket = useSocket({
    "trainer:message": (payload) =>
      setMessages((m) => [...m, payload.message]),

    "engine:move": (payload) =>
      setEngineMove({
        move: payload.move,
        reasoning: payload.reasoning,
      }),

    "focus:change": (payload) =>
      setFocus(payload.activeTurnId),
  });

  const sendMessage = (text) =>
    socket.sendTrainerMessage({
      text,
      timestamp: Date.now(),
    });

  const requestMove = (moveName) =>
    socket.requestEngineMove({
      requestedMove: moveName,
    });

  return (
    <div>
      <FocusOverlay focus={focus} />

      {/* Phase 3C unified deck */}
      <SignalDeck socket={socket} />

      <InterpreterPanel engineMove={engineMove} />
      <MoveToolkit onRequestMove={requestMove} />
      <MessageStream messages={messages} onSend={sendMessage} />
    </div>
  );
}
