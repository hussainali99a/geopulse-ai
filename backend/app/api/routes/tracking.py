
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from uuid import UUID

from app.db.session import engine

router = APIRouter(
    prefix="/api/v1/tracking",
    tags=["Vehicle Tracking"]
)


class GPSLocation(BaseModel):
    event_id: UUID
    vehicle_id: str = Field(min_length=1, max_length=50)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    speed_kmh: float = Field(ge=0, le=300)
    heading: float = Field(ge=0, lt=360)
    timestamp: datetime


@router.post("/location")
def receive_gps_location(payload: GPSLocation):

    recorded_at = payload.timestamp

    # Ensure timestamps are timezone-aware
    if recorded_at.tzinfo is None:
        recorded_at = recorded_at.replace(tzinfo=timezone.utc)

    query = text("""
        INSERT INTO vehicle_locations (
            event_id,
            vehicle_id,
            location,
            speed_kmh,
            heading,
            recorded_at
        )
        VALUES (
            CAST(:event_id AS UUID),
            :vehicle_id,
            ST_SetSRID(
                ST_MakePoint(:longitude, :latitude),
                4326
            ),
            :speed_kmh,
            :heading,
            :recorded_at
        )
        ON CONFLICT (event_id) DO NOTHING
        RETURNING id;
    """)

    try:
        with engine.begin() as connection:
            result = connection.execute(
                query,
                {
                    "event_id": payload.event_id,
                    "vehicle_id": payload.vehicle_id,
                    "latitude": payload.latitude,
                    "longitude": payload.longitude,
                    "speed_kmh": payload.speed_kmh,
                    "heading": payload.heading,
                    "recorded_at": recorded_at,
                }
            )

            record_id = result.scalar_one_or_none()

        if record_id is None:
            return {
                "status": "duplicate",
                "message": "This GPS event was already received.",
                "event_id": payload.event_id
            }

        return {
            "status": "success",
            "message": "GPS location stored successfully.",
            "record_id": record_id,
            "vehicle_id": payload.vehicle_id
        }

    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=503,
            detail="Unable to store GPS location."
        ) from error
        
    
@router.get("/vehicles")
def get_latest_vehicle_locations():
    query = text("""
        SELECT DISTINCT ON (vehicle_id)
            vehicle_id,
            ST_Y(location) AS latitude,
            ST_X(location) AS longitude,
            speed_kmh,
            heading,
            recorded_at
        FROM vehicle_locations
        ORDER BY vehicle_id, recorded_at DESC, id DESC;
    """)

    try:
        with engine.connect() as connection:
            rows = connection.execute(query).mappings().all()

        vehicles = [
            {
                "vehicle_id": row["vehicle_id"],
                "latitude": row["latitude"],
                "longitude": row["longitude"],
                "speed_kmh": row["speed_kmh"],
                "heading": row["heading"],
                "recorded_at": row["recorded_at"],
            }
            for row in rows
        ]

        return {
            "total_vehicles": len(vehicles),
            "vehicles": vehicles
        }

    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve vehicle locations."
        ) from error

