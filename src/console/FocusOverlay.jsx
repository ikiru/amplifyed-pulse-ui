// Phase 3D — Emotional Focus Overlay (UI Only)
// Sits on top of ThreadView messages and visually marks the focused message.
// No engine logic. Driven entirely by props.

import React from "react";
import {
  OverlayContainer,
  HighlightGlow,
  EmotionTag,
  TagText,
} from "./focusOverlay.styles.js";

export default function FocusOverlay({ messages = [], focusedMessageId = null, emotion = "—" }) {
  return (
    <OverlayContainer>
      {messages.map((msg) => (
        <React.Fragment key={msg.id}>
          {msg.id === focusedMessageId && (
            <>
              <HighlightGlow style={{ top: msg._y }} />
              <EmotionTag style={{ top: msg._y }}>
                <TagText>{emotion}</TagText>
              </EmotionTag>
            </>
          )}
        </React.Fragment>
      ))}
    </OverlayContainer>
  );
}
