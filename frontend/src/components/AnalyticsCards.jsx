const cards = [
  { key: "total", label: "Total vehicles", icon: "fleet", format: (value) => value },
  { key: "active", label: "Active vehicles", icon: "active", format: (value) => value },
  { key: "inactive", label: "Inactive vehicles", icon: "inactive", format: (value) => value },
  {
    key: "averageSpeed",
    label: "Average fleet speed",
    icon: "average",
    format: (value) => (value === null ? "—" : `${value.toFixed(1)} km/h`),
  },
  {
    key: "maximumSpeed",
    label: "Maximum speed",
    icon: "maximum",
    format: (value) => (value === null ? "—" : `${value.toFixed(1)} km/h`),
  },
  {
    key: "lastUpdate",
    label: "Last GPS update",
    icon: "update",
    format: (value) =>
      value === null
        ? "—"
        : new Date(value).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
  },
];

const iconPaths = {
  fleet: <><path d="M3 11.5 4.7 6.7a2 2 0 0 1 1.9-1.3h6.8a2 2 0 0 1 1.9 1.3l1.7 4.8M3.5 11.5h14v6h-14zM6 17.5v1m9-1v1" /><circle cx="6" cy="14.5" r=".7" /><circle cx="15" cy="14.5" r=".7" /></>,
  active: <><path d="m4 10 4 4 8-8" /><circle cx="10" cy="10" r="7" /></>,
  inactive: <><circle cx="10" cy="10" r="7" /><path d="M10 6v4l2.5 1.5" /></>,
  average: <><path d="M3 15.5 7 11l3 2.5 6-7" /><path d="M12.5 6.5H16v3.5" /></>,
  maximum: <><path d="M3 15.5 7 11l3 2.5 6-7" /><path d="M12.5 6.5H16v3.5M3 18h14" /></>,
  update: <><circle cx="10" cy="10" r="7" /><path d="M10 6v4l2.5 1.5" /></>,
};

function AnalyticsCards({ metrics }) {
  return (
    <section className="analytics-grid" aria-label="Fleet analytics">
      {cards.map((card) => (
        <article className={`analytics-card analytics-card--${card.key}`} key={card.key}>
          <div className={`analytics-icon analytics-icon--${card.icon}`} aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {iconPaths[card.icon]}
            </svg>
          </div>
          <div className="analytics-copy">
            <span>{card.label}</span>
            <strong>{card.format(metrics[card.key])}</strong>
          </div>
          {card.key === "active" && (
            <span className="metric-live-indicator" aria-label="Live metric" />
          )}
        </article>
      ))}
    </section>
  );
}

export default AnalyticsCards;
