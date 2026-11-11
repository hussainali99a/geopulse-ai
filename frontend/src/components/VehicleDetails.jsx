function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

function VehicleDetails({ vehicle, isActive, onClear }) {
  return (
    <aside className="details-panel" aria-labelledby="details-title">
      <div className="details-heading">
        <div>
          <p className="eyebrow">LIVE TELEMETRY</p>
          <h2 id="details-title">Vehicle details</h2>
        </div>
        {vehicle && (
          <button type="button" className="details-close" onClick={onClear} aria-label="Clear vehicle selection">
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {vehicle ? (
        <>
          <div className="selected-vehicle">
            <span className={`selected-vehicle-icon ${isActive ? "is-active" : "is-inactive"}`} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="m5 11.5 1.6-4.7A1.8 1.8 0 0 1 8.3 5.5h7.4a1.8 1.8 0 0 1 1.7 1.3l1.6 4.7m-15 0h16v6h-16zm2.5 6v1m11-1v1M7 14.5h.01m10-.01h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <strong>{vehicle.vehicle_id}</strong>
              <span className={`tracking-status ${isActive ? "is-active" : "is-inactive"}`}>
                <i /> {isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div className="detail-speed">
            <span>Current speed</span>
            <strong>{Number(vehicle.speed_kmh).toFixed(1)} <small>km/h</small></strong>
          </div>

          <dl className="telemetry-list">
            <div>
              <dt>Latitude</dt>
              <dd>{Number(vehicle.latitude).toFixed(6)}°</dd>
            </div>
            <div>
              <dt>Longitude</dt>
              <dd>{Number(vehicle.longitude).toFixed(6)}°</dd>
            </div>
            <div>
              <dt>Heading</dt>
              <dd>{Number(vehicle.heading).toFixed(1)}°</dd>
            </div>
            <div>
              <dt>Tracking status</dt>
              <dd className={`detail-status ${isActive ? "is-active" : "is-inactive"}`}>
                <i /> {isActive ? "Active" : "Inactive"}
              </dd>
            </div>
            <div className="telemetry-timestamp">
              <dt>Last GPS timestamp</dt>
              <dd>{formatTimestamp(vehicle.recorded_at)}</dd>
            </div>
          </dl>

          <div className="selection-note">
            <span className="selection-crosshair" aria-hidden="true" />
            <span>Map centered on selected vehicle</span>
          </div>
        </>
      ) : (
        <div className="details-empty">
          <span className="details-empty-icon" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none">
              <path d="M24 7v34M7 24h34" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 4" />
              <circle cx="24" cy="24" r="9" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="24" cy="24" r="2" fill="currentColor" />
            </svg>
          </span>
          <strong>Select a vehicle</strong>
          <p>Choose a vehicle from the directory or map to inspect its latest GPS telemetry.</p>
        </div>
      )}
    </aside>
  );
}

export default VehicleDetails;
