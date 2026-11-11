import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

const BHOPAL_CENTER = [23.2599, 77.4126];

function MapSelection({ vehicle }) {
  const map = useMap();
  const lastCenteredVehicleId = useRef(null);

  useEffect(() => {
    if (vehicle && lastCenteredVehicleId.current !== vehicle.vehicle_id) {
      lastCenteredVehicleId.current = vehicle.vehicle_id;
      map.flyTo(
        [Number(vehicle.latitude), Number(vehicle.longitude)],
        Math.max(map.getZoom(), 16),
        { duration: 0.45 },
      );
    }
  }, [map, vehicle]);

  return null;
}

function vehicleIcon(vehicle, active, selected) {
  const statusClass = active ? "is-active" : "is-inactive";
  const selectedClass = selected ? "is-selected" : "";
  const rotation = Number.isFinite(Number(vehicle.heading))
    ? Number(vehicle.heading)
    : 0;
  const html = `<span class="map-vehicle ${statusClass} ${selectedClass}" style="--vehicle-heading:${rotation}deg"><svg viewBox="0 0 24 24" fill="none"><path d="m5 11.5 1.6-4.7A1.8 1.8 0 0 1 8.3 5.5h7.4a1.8 1.8 0 0 1 1.7 1.3l1.6 4.7m-15 0h16v6h-16zm2.5 6v1m11-1v1M7 14.5h.01m10-.01h.01" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;

  return L.divIcon({
    className: "map-vehicle-icon",
    html,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -17],
  });
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

function FleetMap({
  vehicles,
  vehicleStatuses,
  selectedVehicleId,
  onSelectVehicle,
}) {
  const mapFrameRef = useRef(null);
  const selectedVehicle = vehicles.find(
    (vehicle) => vehicle.vehicle_id === selectedVehicleId,
  );
  const [fullscreenError, setFullscreenError] = useState("");

  const mappedVehicles = vehicles.filter(
    (vehicle) =>
      Number.isFinite(Number(vehicle.latitude)) &&
      Number.isFinite(Number(vehicle.longitude)),
  );

  const toggleFullscreen = async () => {
    setFullscreenError("");

    try {
      if (document.fullscreenElement === mapFrameRef.current) {
        await document.exitFullscreen();
      } else if (!document.fullscreenElement) {
        await mapFrameRef.current.requestFullscreen();
      }
    } catch (error) {
      setFullscreenError(`Fullscreen unavailable: ${error.message}`);
    }
  };

  return (
    <section className="map-panel" aria-labelledby="map-title">
      <div className="map-panel-heading">
        <div>
          <p className="eyebrow">LIVE GPS POSITIONS</p>
          <h2 id="map-title">Fleet map</h2>
        </div>
        <div className="map-heading-meta">
          <span className="map-vehicle-count">
            <span className="status-dot" />
            {mappedVehicles.length} on map
          </span>
        </div>
      </div>

      {fullscreenError && <p className="map-error" role="status">{fullscreenError}</p>}

      <div className="map-frame" ref={mapFrameRef}>
        <button
          type="button"
          className="fullscreen-button map-fullscreen-button"
          onClick={toggleFullscreen}
          aria-label="Toggle map fullscreen"
          title="Toggle map fullscreen"
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M7.5 3.5h-4v4m9-4h4v4m0 5v4h-4m-9-4v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <MapContainer center={BHOPAL_CENTER} zoom={12} className="fleet-map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapSelection vehicle={selectedVehicle} />
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={60}
            disableClusteringAtZoom={16}
            showCoverageOnHover={false}
            spiderfyOnMaxZoom
          >
            {mappedVehicles.map((vehicle) => {
              const active = vehicleStatuses.get(vehicle.vehicle_id);
              const selected = vehicle.vehicle_id === selectedVehicleId;

              return (
                <Marker
                  key={vehicle.vehicle_id}
                  position={[Number(vehicle.latitude), Number(vehicle.longitude)]}
                  icon={vehicleIcon(vehicle, active, selected)}
                  eventHandlers={{
                    click: () => onSelectVehicle(vehicle.vehicle_id),
                  }}
                >
                  <Popup>
                    <div className="map-popup">
                      <div className="map-popup-heading">
                        <strong>{vehicle.vehicle_id}</strong>
                        <span className={`popup-status ${active ? "is-active" : "is-inactive"}`}>
                          <i /> {active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div><span>Latitude</span><strong>{Number(vehicle.latitude).toFixed(6)}°</strong></div>
                      <div><span>Longitude</span><strong>{Number(vehicle.longitude).toFixed(6)}°</strong></div>
                      <div><span>Speed</span><strong>{Number(vehicle.speed_kmh).toFixed(1)} km/h</strong></div>
                      <div><span>Heading</span><strong>{Number(vehicle.heading).toFixed(1)}°</strong></div>
                      <div className="popup-timestamp"><span>Last GPS update</span><strong>{formatTimestamp(vehicle.recorded_at)}</strong></div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        </MapContainer>

        {mappedVehicles.length === 0 && (
          <div className="map-empty">
            <strong>{vehicles.length ? "No valid GPS coordinates" : "Waiting for GPS data"}</strong>
            <span>{vehicles.length ? "Vehicle data is available, but no positions can be plotted." : "Vehicle positions will appear here when the API receives updates."}</span>
          </div>
        )}

        <div className="map-legend" aria-label="Vehicle status legend">
          <span className="legend-title">VEHICLE STATUS</span>
          <span><i className="legend-dot is-active" /> Active</span>
          <span><i className="legend-dot is-inactive" /> Inactive</span>
          <span><i className="legend-selected" /> Selected</span>
        </div>
      </div>
    </section>
  );
}

export default FleetMap;
