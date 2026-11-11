from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from app.api.routes import tracking

from app.db.session import engine
from app.api.routes import geo

app = FastAPI(
    title="GeoPulse AI API",
    description="Geospatial intelligence and real-time tracking platform",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(geo.router)
app.include_router(tracking.router)
# Keep your existing root and health endpoints below.
app.include_router(geo.router)


@app.get("/")
def root():

    return {
        "project": "GeoPulse AI",
        "status": "running",
        "version": "0.1.0"
    }


@app.get("/health")
def health_check():

    try:
        with engine.connect() as connection:

            connection.execute(text("SELECT 1"))

            postgis_version = connection.execute(
                text("SELECT PostGIS_Full_Version()")
            ).scalar_one()

        return {
            "api": "healthy",
            "database": "connected",
            "postgis": "enabled",
            "postgis_version": postgis_version
        }

    except SQLAlchemyError as error:

        raise HTTPException(
            status_code=503,
            detail="Database connection unavailable."
        ) from error