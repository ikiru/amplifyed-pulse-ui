// src/pages/TrainerView.jsx
import React, { useState } from "react";
import useSocket from "../socket/useSocket";

import MessageStream from "../console/MessageStream";
import InterpreterPanel from "../console/InterpreterPanel";
import MoveToolkit from "../console/MoveToolkit";
import PulseTimeline from "../console/PulseTimeline";
import FocusOverlay from "../console/FocusOverlay";

export default function TrainerView() {
  const [messages, setMessages] = useState([]);
  const [engineMove, setEngineMove] = useState(null);
  const [pulse, setPulse] = useState(null);
  const [focus, setFocus] = useState(null);

const socket = useSocket({
  "trainer:message": (payload) =>
    setMessages((m) => [...m, payload.message]),

  "engine:move": (payload) =>
    setEngineMove({ move: payload.move, reasoning: payload.reasoning }),

  "pulse:update": (payload) =>
    setPulse(payload.values),

  "focus:change": (payload) =>
    setFocus(payload.activeTurnId),
});


  const sendMessage = (text) =>
    socket.sendTrainerMessage({ text, timestamp: Date.now() });

  const requestMove = (moveName) =>
    socket.requestEngineMove({ requestedMove: moveName });

  return (
    <div>
      <FocusOverlay focus={focus} />

      <PulseTimeline
        data={pulse}
        onSelect={(turnId) => socket.setFocus({ targetTurnId: turnId })}
      />

      <InterpreterPanel engineMove={engineMove} />

      <MoveToolkit onRequestMove={requestMove} />

      <MessageStream
        messages={messages}
        onSend={sendMessage}
      />
    </div>
  );
}
