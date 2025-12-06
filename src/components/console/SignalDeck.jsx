import React from "react";

export default function SignalDeck({ pulses }) {
  const items = Array.isArray(pulses) ? pulses : [];
  const latest = items[items.length - 1];
  const counts = latest?.counts ?? {
    engaged: 0,
    neutral: 0,
    frustrated: 0,
  };

  return (
    <div className="signal-deck">
      <div>engaged: {counts.engaged}</div>
      <div>neutral: {counts.neutral}</div>
      <div>frustrated: {counts.frustrated}</div>
    </div>
  );
}
