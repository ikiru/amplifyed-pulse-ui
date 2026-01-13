/**
 * PulseSummary Component
 * 
 * Displays a summary of current pulse vote distribution (engaged, neutral, frustrated).
 * Shows counts in a three-column layout for quick at-a-glance understanding of room sentiment.
 */

export function PulseSummary({ summaryVoteTotals }) {
  const totals = summaryVoteTotals ?? {
    engaged: 0,
    neutral: 0,
    frustrated: 0,
  };
  const columns = [
    { label: "Engaged", value: totals.engaged },
    { label: "Neutral", value: totals.neutral },
    { label: "Frustrated", value: totals.frustrated },
  ];

  return (
    <div className="pulse-distribution">
      {columns.map(({ label, value }) => (
        <div key={label} className="pulse-distribution-column">
          <span className="label pulse-distribution-label">{label}</span>
          <span className="value pulse-distribution-value">{value}</span>
        </div>
      ))}
    </div>
  );
}
