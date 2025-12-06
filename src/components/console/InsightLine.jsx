import React from "react";

export default function InsightLine({ pulses = [] }) {
  if (!pulses.length) {
    return <div className="insight-line-empty">No data yet</div>;
  }

  const values = pulses.map((p) => p.score ?? 0);
  const min = Math.min(...values);
  const max = Math.max(...values);

  const scale = (v) => {
    if (max === min) return 0.5;
    return (v - min) / (max - min);
  };

  const points = values
    .map((v, i) => `${i},${1 - scale(v)}`)
    .join(" ");

  return (
    <svg className="insight-line" viewBox={`0 0 ${values.length} 1`}>
      <polyline
        points={points}
        fill="none"
        stroke="#0077FF"
        strokeWidth="0.02"
      />
    </svg>
  );
}
