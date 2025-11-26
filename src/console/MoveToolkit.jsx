// src/console/MoveToolkit.jsx
import React from "react";
import { ToolkitContainer, MoveButton } from "./moveToolkit.styles";

export default function MoveToolkit({ onRequestMove }) {
  const moves = [
    { key: "summarize", label: "Summarize" },
    { key: "reflect", label: "Reflect" },
    { key: "nudge", label: "Nudge" },
    { key: "triage", label: "Triage" }
  ];

  return (
    <ToolkitContainer>
      {moves.map(({ key, label }) => (
        <MoveButton
          key={key}
          onClick={() => onRequestMove(key)}
        >
          {label}
        </MoveButton>
      ))}
    </ToolkitContainer>
  );
}
