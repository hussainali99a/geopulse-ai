function formatTime(timestamp) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? "Unknown"
    : date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
}

function VehicleList({
  vehicles,
  totalCount,
  loading,
  search,
  onSearch,
  statusFilter,
  onStatusFilter,
  sortOrder,
  onSortOrder,
  selectedVehicleId,
  onSelectVehicle,
  vehicleStatuses,
}) {
  return (
    <section className="vehicle-directory" id="vehicle-directory" aria-labelledby="directory-title">
      <div className="directory-heading">
        <div>
          <p className="eyebrow">FLEET</p>
          <h2 id="directory-title">Vehicle directory</h2>
        </div>
        <span className="directory-count">{vehicles.length}<small> / {totalCount}</small></span>
      </div>

      <label className="vehicle-search">
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="8.8" cy="8.8" r="5.8" stroke="currentColor" strokeWidth="1.5" />
          <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search vehicle ID"
          aria-label="Search vehicles by ID"
        />
        {search && (
          <button type="button" className="clear-search" onClick={() => onSearch("")} aria-label="Clear search">
            ×
          </button>
        )}
      </label>

      <div className="directory-controls">
        <div className="filter-tabs" role="group" aria-label="Filter vehicles by status">
          {["all", "active", "inactive"].map((filter) => (
            <button
              type="button"
              key={filter}
              className={statusFilter === filter ? "is-selected" : ""}
              onClick={() => onStatusFilter(filter)}
              aria-pressed={statusFilter === filter}
            >
              {filter === "all" ? "All" : filter[0].toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
        <label className="sort-control">
          <span className="sr-only">Sort vehicles by speed</span>
          <select value={sortOrder} onChange={(event) => onSortOrder(event.target.value)}>
            <option value="speed-desc">Speed ↓</option>
            <option value="speed-asc">Speed ↑</option>
          </select>
        </label>
      </div>

      <div className="vehicle-items" aria-live="polite">
        {vehicles.length > 0 ? (
          vehicles.map((vehicle) => {
            const active = vehicleStatuses.get(vehicle.vehicle_id);
            const selected = selectedVehicleId === vehicle.vehicle_id;

            return (
              <button
                type="button"
                className={`vehicle-item ${selected ? "is-selected" : ""}`}
                key={vehicle.vehicle_id}
                onClick={() => onSelectVehicle(vehicle.vehicle_id)}
                aria-pressed={selected}
              >
                <span className="vehicle-item-main">
                  <span className={`vehicle-symbol ${active ? "is-active" : "is-inactive"}`} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="m5 11.5 1.6-4.7A1.8 1.8 0 0 1 8.3 5.5h7.4a1.8 1.8 0 0 1 1.7 1.3l1.6 4.7m-15 0h16v6h-16zm2.5 6v1m11-1v1M7 14.5h.01m10-.01h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="vehicle-identity">
                    <strong>{vehicle.vehicle_id}</strong>
                    <span className={`tracking-status ${active ? "is-active" : "is-inactive"}`}>
                      <i /> {active ? "Active" : "Inactive"}
                    </span>
                  </span>
                  <span className="vehicle-speed">
                    {Number(vehicle.speed_kmh).toFixed(1)}
                    <small>km/h</small>
                  </span>
                </span>
                <span className="vehicle-item-meta">
                  <span>Heading <strong>{Number(vehicle.heading).toFixed(0)}°</strong></span>
                  <time dateTime={vehicle.recorded_at} title={new Date(vehicle.recorded_at).toLocaleString()}>
                    Updated {formatTime(vehicle.recorded_at)}
                  </time>
                </span>
              </button>
            );
          })
        ) : (
          <div className="vehicle-empty">
            <span className="empty-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <strong>
              {loading
                ? "Connecting to fleet"
                : totalCount === 0
                  ? "No vehicles reporting"
                  : "No vehicles match"}
            </strong>
            <p>
              {loading
                ? "Vehicle locations will appear as soon as GPS data arrives."
                : totalCount === 0
                  ? "Start the GPS simulator to populate your fleet."
                  : "Try another search or status filter."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default VehicleList;
