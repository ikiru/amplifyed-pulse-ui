import React from "react";

/**
 * InsightsPanel
 * 
 * Displays pull-only insights grouped by category.
 * Shown when trainer clicks "Insights" toggle button.
 * 
 * @param {object} props
 * @param {Array} props.insights - Array of insight objects
 */
export function InsightsPanel({ insights }) {
  if (!insights || !Array.isArray(insights) || insights.length === 0) {
    return (
      <div className="trainer-insights-panel">
        <h3 className="trainer-section-heading">Insights</h3>
        <p className="trainer-text-muted">No Insights yet</p>
      </div>
    );
  }

  // Group insights by category
  const groupedInsights = insights.reduce((acc, insight) => {
    const key = insight.category ?? "Other";
    acc[key] = acc[key] || [];
    acc[key].push(insight);
    return acc;
  }, {});

  return (
    <div className="trainer-insights-panel">
      <h3 className="trainer-section-heading">Insights</h3>
      {Object.entries(groupedInsights).map(([category, categoryInsights]) => (
        <div key={category} className="trainer-insights-category">
          <div className="trainer-insights-category-label">
            {category.toUpperCase()}
          </div>
          <ul className="trainer-insights-list">
            {categoryInsights.map((insight) => (
              <li key={insight.id} className="trainer-insight-item">
                {insight.language}
                {typeof insight.confidence === "number" && (
                  <span className="trainer-insight-confidence">
                    {" "}
                    (confidence {Math.round(insight.confidence * 100)}%)
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
