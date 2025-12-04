import React from "react";

export default function SignalDeck({ pulses }) {
  const list = pulses ?? [];

  if (!Array.isArray(pulses)) {
    console.warn("SignalDeck received non-array pulses:", pulses);
  }

  return (
    <div className="signal-deck">
      <header className="signal-deck__header">Signal Deck</header>
      {list.length === 0 ? (
        <div className="signal-deck__empty">No signals to show yet</div>
      ) : (
        <ul className="signal-deck__list">
          {list.map((pulse, idx) => {
            const emotion = typeof pulse?.emotion === "string" ? pulse.emotion : "neutral";
            const value = Number.isFinite(pulse?.value) ? pulse.value : 0;
            return (
              <li key={idx} className="signal-deck__item">
                <span className="signal-deck__emotion">{emotion}</span>
                <span className="signal-deck__value">{value.toFixed(2)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
