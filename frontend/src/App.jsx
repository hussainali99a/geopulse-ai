import { useEffect, useMemo, useState } from "react";
import AnalyticsCards from "./components/AnalyticsCards.jsx";
import FleetMap from "./components/FleetMap.jsx";
import VehicleDetails from "./components/VehicleDetails.jsx";
import VehicleList from "./components/VehicleList.jsx";
import "./App.css";

const API_URL = "http://127.0.0.1:8000/api/v1/tracking/vehicles";
const DEFAULT_INACTIVITY_MINUTES = 5;
const configuredInactivityMinutes = Number(
  import.meta.env.VITE_VEHICLE_INACTIVITY_MINUTES ??
    DEFAULT_INACTIVITY_MINUTES,
);
const INACTIVITY_MINUTES =
  Number.isFinite(configuredInactivityMinutes) &&
  configuredInactivityMinutes > 0
    ? configuredInactivityMinutes
    : DEFAULT_INACTIVITY_MINUTES;

if (INACTIVITY_MINUTES !== configuredInactivityMinutes) {
  console.warn(
    `VITE_VEHICLE_INACTIVITY_MINUTES must be a positive number. Using ${DEFAULT_INACTIVITY_MINUTES} minutes.`,
  );
}

function isVehicleActive(vehicle, now) {
  const timestamp = Date.parse(vehicle.recorded_at);
  return Number.isFinite(timestamp) && now - timestamp <= INACTIVITY_MINUTES * 60_000;
}

function App() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("speed-desc");

  useEffect(() => {
    let isMounted = true;
    let requestInProgress = false;

    const fetchVehicles = async () => {
      if (requestInProgress) return;
      requestInProgress = true;

      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`Vehicle API returned HTTP ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data.vehicles)) {
          throw new Error("Vehicle API response did not include a vehicles list");
        }

        if (isMounted) {
          const uniqueVehicles = new Map(
            data.vehicles.map((vehicle) => [vehicle.vehicle_id, vehicle]),
          );
          setVehicles([...uniqueVehicles.values()]);
          setError("");
          setLoading(false);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError.message);
          setLoading(false);
        }
      } finally {
        requestInProgress = false;
      }
    };

    fetchVehicles();
    const fetchInterval = window.setInterval(fetchVehicles, 2_000);
    const clockInterval = window.setInterval(() => setNow(Date.now()), 10_000);

    return () => {
      isMounted = false;
      window.clearInterval(fetchInterval);
      window.clearInterval(clockInterval);
    };
  }, []);

  const vehicleStatuses = useMemo(
    () =>
      new Map(
        vehicles.map((vehicle) => [
          vehicle.vehicle_id,
          isVehicleActive(vehicle, now),
        ]),
      ),
    [vehicles, now],
  );

  const activeCount = useMemo(
    () => [...vehicleStatuses.values()].filter(Boolean).length,
    [vehicleStatuses],
  );

  const metrics = useMemo(() => {
    const speeds = vehicles
      .map((vehicle) => Number(vehicle.speed_kmh))
      .filter(Number.isFinite);
    const timestamps = vehicles
      .map((vehicle) => Date.parse(vehicle.recorded_at))
      .filter(Number.isFinite);

    return {
      total: vehicles.length,
      active: activeCount,
      inactive: vehicles.length - activeCount,
      averageSpeed: speeds.length
        ? speeds.reduce((total, speed) => total + speed, 0) / speeds.length
        : null,
      maximumSpeed: speeds.length ? Math.max(...speeds) : null,
      lastUpdate: timestamps.length ? Math.max(...timestamps) : null,
    };
  }, [activeCount, vehicles]);

  const visibleVehicles = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = vehicles.filter((vehicle) => {
      const active = vehicleStatuses.get(vehicle.vehicle_id);
      const matchesSearch = vehicle.vehicle_id
        .toLowerCase()
        .includes(normalizedSearch);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && active) ||
        (statusFilter === "inactive" && !active);
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((first, second) => {
      const firstSpeed = Number(first.speed_kmh) || 0;
      const secondSpeed = Number(second.speed_kmh) || 0;
      return sortOrder === "speed-asc"
        ? firstSpeed - secondSpeed
        : secondSpeed - firstSpeed;
    });
  }, [search, sortOrder, statusFilter, vehicleStatuses, vehicles]);

  const selectedVehicle =
    vehicles.find((vehicle) => vehicle.vehicle_id === selectedVehicleId) ?? null;

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#overview" aria-label="GeoPulse AI home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path
                d="M5 22.5 11.2 16l4.4 4.2L27 8.5M20.5 8.5H27V15"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="7" cy="24" r="2" fill="currentColor" />
            </svg>
          </span>
          <span className="brand-copy">
            <strong>GeoPulse <em>AI</em></strong>
            <span>FLEET INTELLIGENCE</span>
          </span>
        </a>

        <div className="topbar-context">
          <span className="context-divider" />
          <div className="context-location">
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M16 8.3c0 4.2-6 9-6 9s-6-4.8-6-9a6 6 0 1 1 12 0Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle cx="10" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span>Bhopal, India</span>
          </div>
        </div>

        <div className="topbar-status">
          <span className={`connection-pill ${error ? "is-error" : ""}`}>
            <span className="status-dot" />
            {error ? "Connection issue" : loading ? "Connecting" : "Live tracking"}
          </span>
          <span className="topbar-update">
            Updated{" "}
            {metrics.lastUpdate
              ? new Date(metrics.lastUpdate).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : "—"}
          </span>
        </div>
      </header>

      <div className="dashboard-shell" id="overview">
        <aside className="sidebar">
          <nav className="sidebar-nav" aria-label="Main navigation">
            <a className="nav-item is-current" href="#overview">
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="11.5" y="3" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="3" y="11.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              Fleet monitor
            </a>
            <a className="nav-item" href="#vehicle-directory">
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 11.5 4.5 7h11l1.5 4.5v5h-14v-5ZM5 16.5v1m10-1v1M4 11.5h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="6" cy="14" r=".8" fill="currentColor" />
                <circle cx="14" cy="14" r=".8" fill="currentColor" />
              </svg>
              Vehicles
              <span className="nav-count">{vehicles.length}</span>
            </a>
          </nav>

          <VehicleList
            vehicles={visibleVehicles}
            totalCount={vehicles.length}
            loading={loading}
            search={search}
            onSearch={setSearch}
            statusFilter={statusFilter}
            onStatusFilter={setStatusFilter}
            sortOrder={sortOrder}
            onSortOrder={setSortOrder}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={setSelectedVehicleId}
            vehicleStatuses={vehicleStatuses}
          />

          <div className="sidebar-foot">
            <span className="sidebar-foot-mark">GP</span>
            <span>
              <strong>GeoPulse AI</strong>
              <small>Fleet operations</small>
            </span>
            <span className="sidebar-version">PHASE 02</span>
          </div>
        </aside>

        <main className="main-content">
          <section className="page-heading" aria-labelledby="page-title">
            <div>
              <p className="eyebrow">OPERATIONS CENTER <span>/</span> LIVE MONITORING</p>
              <h1 id="page-title">Fleet overview</h1>
              <p className="page-subtitle">
                Monitor vehicle activity and live GPS telemetry across your fleet.
              </p>
            </div>
            <div className="threshold-note">
              <span className="threshold-indicator" />
              Inactive after {INACTIVITY_MINUTES} min without GPS
            </div>
          </section>

          {error && (
            <div className="api-alert" role="alert">
              <span className="alert-icon" aria-hidden="true">!</span>
              <span>
                <strong>Unable to refresh fleet data</strong>
                <small>{error}. Showing the latest available data.</small>
              </span>
            </div>
          )}

          <AnalyticsCards metrics={metrics} />

          <section className="operations-grid" aria-label="Fleet operations">
            <FleetMap
              vehicles={vehicles}
              vehicleStatuses={vehicleStatuses}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={setSelectedVehicleId}
            />
            <VehicleDetails
              vehicle={selectedVehicle}
              isActive={
                selectedVehicle
                  ? vehicleStatuses.get(selectedVehicle.vehicle_id)
                  : false
              }
              onClear={() => setSelectedVehicleId(null)}
            />
          </section>
          <footer className="dashboard-footer">
            <span>GeoPulse AI <span className="footer-divider">·</span> Live fleet intelligence</span>
            <span>GPS data refreshes every 2 seconds</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;
