
# GeoPulse AI

GeoPulse AI is a geospatial intelligence and real-time fleet tracking platform focused on Bhopal, India. The project combines a FastAPI backend, PostGIS-powered geospatial data processing, and a React/Vite dashboard to simulate and visualize live vehicle movement.

## Overview

The platform is designed to support:

- Real-time vehicle GPS ingestion
- Interactive map visualization for fleet movement
- Geospatial calculations using PostGIS
- Fleet analytics such as latest vehicle positions and activity
- Local simulation of GPS telemetry for development and demos
- A foundation for future AI-driven route and safety insights

## Current capabilities

- FastAPI services for geospatial queries and GPS tracking
- PostgreSQL + PostGIS database with geospatial extension enabled
- React dashboard rendered with Vite and Leaflet
- GPS simulator script to send vehicle events over HTTP
- Health and readiness checks for the API and database

## Tech stack

- Python 3
- FastAPI
- SQLAlchemy
- PostgreSQL + PostGIS
- React + Vite
- Leaflet / react-leaflet
- Docker Compose

## Repository structure

```text
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   ├── core/
│   │   └── db/
│   └── requirements.txt
├── database/
│   └── init/
├── docs/
├── frontend/
│   ├── public/
│   └── src/
├── scripts/
│   └── gps_simulator.py
├── docker-compose.yml
├── README.md
└── .env (local environment file, not committed)
```

## Local setup

### 1) Configure environment variables

Create a `.env` file in the project root with database settings matching the Docker Postgres service:

```env
POSTGRES_DB=geopulse
POSTGRES_USER=geopulse
POSTGRES_PASSWORD=geopulse
POSTGRES_PORT=5433
```

### 2) Start the PostGIS database

```bash
docker compose up -d
```

This starts the `postgis/postgis:16-3.4` container and initializes PostGIS using the scripts under `database/init/`.

### 3) Start the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# or .venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:

- http://127.0.0.1:8000/
- http://127.0.0.1:8000/health

### 4) Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The dashboard runs by default at:

- http://127.0.0.1:5173/

## Demo data and simulation

A GPS simulator is included to generate synthetic fleet traffic around Bhopal and push it to the tracking API.

```bash
python scripts/gps_simulator.py --vehicles 25 --interval 2 --batches 10
```

This script sends periodic vehicle location updates to:

- http://127.0.0.1:8000/api/v1/tracking/location

## API endpoints

### Health

- `GET /` - root API metadata
- `GET /health` - checks database and PostGIS availability

### Geospatial

- `GET /api/v1/geo/bhopal` - returns Bhopal city coordinates
- `GET /api/v1/geo/distance?lat1=...&lon1=...&lat2=...&lon2=...` - computes distance in meters and kilometers between two points

### Tracking

- `POST /api/v1/tracking/location` - stores a GPS location event for a vehicle
- `GET /api/v1/tracking/vehicles` - returns the latest known position for each vehicle

## Data model

The application uses a `vehicle_locations` table with geospatial support for point-based tracking. Each event stores:

- `event_id`
- `vehicle_id`
- `location` (PostGIS geometry point)
- `speed_kmh`
- `heading`
- `recorded_at`

## Roadmap

This project is currently in the foundation phase and is structured for expansion into:

- route deviation detection
- ETA prediction
- geospatial heatmaps and analytics
- AI-assisted operational insights
- larger-scale fleet monitoring and reporting

## Notes

- The PostGIS extension is initialized automatically via `database/init/01_extensions.sql`.
- The frontend dashboard polls the tracking endpoint every few seconds to render live location data.
- This repository is intended for local development and experimentation around geospatial intelligence and fleet analytics.
