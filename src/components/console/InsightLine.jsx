import React from "react";

export default function InsightLine({ pulses }) {
  const points = pulses ?? [];

  if (!Array.isArray(pulses)) {
    console.warn("InsightLine received non-array pulses:", pulses);
  }

  const recent = points.slice(-6).reverse();

  return (
    <div className="insight-line">
      <header className="insight-line__header">Insight Line</header>
      {recent.length === 0 ? (
        <div className="insight-line__empty">Waiting for audience signals…</div>
      ) : (
        <div className="insight-line__points">
          {recent.map((pulse, idx) => {
            const emotion = typeof pulse?.emotion === "string" ? pulse.emotion : "neutral";
            const value = Number.isFinite(pulse?.value) ? pulse.value : 0;
            return (
              <span key={idx} className="insight-line__point">
                {emotion} ({value.toFixed(2)})
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
