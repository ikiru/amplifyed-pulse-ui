// src/shared/MessageBubble.jsx
import React from "react";
import {
  bubbleBase,
  userBubble,
  facilitatorBubble,
  focused,
  author
} from "./styles/messageBubble.styles.js";

export default function MessageBubble({ msg, isFocused }) {
  if (!msg) return null;

  // Normalize text to something safe
  const safeText =
    typeof msg.text === "string" || typeof msg.text === "number"
      ? msg.text
      : msg.text
      ? JSON.stringify(msg.text, null, 2)
      : "";

  const isFacilitator = msg.role === "facilitator";

  const styledBubble = {
    ...bubbleBase,
    ...(isFacilitator ? facilitatorBubble : userBubble),
    ...(isFocused ? focused : {})
  };

  return (
    <div style={styledBubble}>
      <span style={author}>{isFacilitator ? "Facilitator" : "User"}:</span>{" "}
      {safeText}
    </div>
  );
}
