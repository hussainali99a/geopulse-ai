
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.db.session import engine


router = APIRouter(
    prefix="/api/v1/geo",
    tags=["Geospatial"]
)


@router.get("/bhopal")
def get_bhopal_location():

    return {
        "city": "Bhopal",
        "country": "India",
        "latitude": 23.2599,
        "longitude": 77.4126,
        "coordinate_system": "EPSG:4326"
    }


@router.get("/distance")
def calculate_distance(
    lat1: float = Query(ge=-90, le=90),
    lon1: float = Query(ge=-180, le=180),
    lat2: float = Query(ge=-90, le=90),
    lon2: float = Query(ge=-180, le=180)
):

    query = text("""
        SELECT ST_Distance(
            ST_SetSRID(
                ST_MakePoint(:lon1, :lat1), 4326
            )::geography,
            ST_SetSRID(
                ST_MakePoint(:lon2, :lat2), 4326
            )::geography
        ) AS distance_meters;
    """)

    try:
        with engine.connect() as connection:
            distance = connection.execute(
                query,
                {
                    "lat1": lat1,
                    "lon1": lon1,
                    "lat2": lat2,
                    "lon2": lon2
                }
            ).scalar_one()

        return {
            "distance_meters": round(distance, 2),
            "distance_km": round(distance / 1000, 3)
        }

    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=503,
            detail="Geospatial database query failed."
        ) from error
