/**
 * ConfusionMeter Component
 * 
 * Displays a visual meter representing confusion level as a series of bars.
 * Used in both TrainerView and thread displays to indicate confusion intensity.
 */

export function ConfusionMeter({ confusionScore }) {
  const MAX_BARS = 8;
  const normalizedScore = confusionScore ?? 0;
  const filled = Math.max(0, Math.min(normalizedScore, MAX_BARS));

  return (
    <div className="confusion-meter" aria-hidden="true">
      <div className="confusion-bars">
        {Array.from({ length: MAX_BARS }).map((_, i) => (
          <span
            key={i}
            className={i < filled ? "bar filled" : "bar empty"}
          />
        ))}
      </div>
    </div>
  );
}
