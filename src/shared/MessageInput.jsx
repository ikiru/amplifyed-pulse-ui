// src/shared/MessageInput.jsx
// Phase 3 → Phase 4 clean version (NO hook collisions)

import React, { useState } from "react";
import {
  Container,
  TextInput,
  SendButton
} from "./styles/messageInput.styles.js";

import useSocket from "../socket/useSocket.js";

export default function MessageInput({
  onSend,
  placeholder = "Type your message...",
  disabled = false,
  cooldown = { ready: true },
}) {
  const [text, setText] = useState("");
  const socket = useSocket();

  const isOnCooldown = cooldown?.ready === false;
  const isDisabled = disabled || isOnCooldown;

  const triggerSend = () => {
    if (isDisabled) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    if (onSend) {
      onSend(trimmed);
    } else if (socket) {
      socket.sendAudienceMessage({
        text: trimmed,
        timestamp: Date.now(),
      });
    }

    setText("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      triggerSend();
    }
  };

  return (
    <Container>
      <TextInput
        value={text}
        placeholder={placeholder}
        disabled={isDisabled}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
      />
      <SendButton
        disabled={isDisabled}
        onClick={triggerSend}
      >
        Send
      </SendButton>
    </Container>
  );
}
