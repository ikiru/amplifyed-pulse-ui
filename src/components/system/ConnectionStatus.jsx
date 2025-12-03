// src/components/system/ConnectionStatus.jsx
// North Star: Radical Transparency
// A tiny component that exposes socket health clearly on every major page.
import React from "react";

export default function ConnectionStatus({ status }) {
  if (!status) return null;

  return (
    <div className="connection-status">
      Socket: {status}
    </div>
  );
}
