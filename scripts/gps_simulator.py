
import argparse
import json
import math
import random
import time
import uuid

from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

API_URL = "http://127.0.0.1:8000/api/v1/tracking/location"

# Bhopal reference coordinates
CENTER_LAT = 23.2599
CENTER_LON = 77.4126


def generate_vehicle(vehicle_number):
    return {
        "id": f"VEH-{vehicle_number:04d}",
        "radius": random.uniform(0.5, 5.0),
        "speed": random.uniform(15, 60),
        "phase": random.uniform(0, 360),
    }


def generate_gps_event(vehicle):
    angle = math.radians(
        (vehicle["phase"] + random.uniform(-2, 2)) % 360
    )

    radius = vehicle["radius"]

    latitude = CENTER_LAT + (
        radius * math.cos(angle) / 111.32
    )

    longitude = CENTER_LON + (
        radius * math.sin(angle)
        / (111.32 * math.cos(math.radians(CENTER_LAT)))
    )

    return {
        "event_id": str(uuid.uuid4()),
        "vehicle_id": vehicle["id"],
        "latitude": latitude,
        "longitude": longitude,
        "speed_kmh": round(vehicle["speed"], 2),
        "heading": round((math.degrees(angle) + 90) % 360, 2),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def send_gps_event(event):
    payload = json.dumps(event).encode("utf-8")

    request = Request(
        API_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=5) as response:
            return response.status == 200

    except (HTTPError, URLError, TimeoutError) as error:
        print(f"Error for {event['vehicle_id']}: {error}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="GeoPulse AI GPS Simulator"
    )

    parser.add_argument("--vehicles", type=int, default=100)
    parser.add_argument("--interval", type=float, default=2)
    parser.add_argument("--batches", type=int, default=30)

    args = parser.parse_args()

    if not 1 <= args.vehicles <= 10000:
        parser.error("--vehicles must be between 1 and 10000")

    if args.interval <= 0:
        parser.error("--interval must be greater than zero")

    if args.batches < 1:
        parser.error("--batches must be at least 1")

    vehicles = [
        generate_vehicle(number)
        for number in range(1, args.vehicles + 1)
    ]

    print(f"GeoPulse AI: Starting {len(vehicles)} simulated vehicles")

    total_success = 0
    total_failed = 0

    try:
        for batch in range(1, args.batches + 1):
            batch_success = 0

            for vehicle in vehicles:
                event = generate_gps_event(vehicle)

                if send_gps_event(event):
                    batch_success += 1

            total_success += batch_success
            total_failed += len(vehicles) - batch_success

            print(
                f"Batch {batch}/{args.batches} | "
                f"Successful: {batch_success}/{len(vehicles)}"
            )

            if batch < args.batches:
                time.sleep(args.interval)

    except KeyboardInterrupt:
        print("\nSimulation stopped by user.")

    print("\nSimulation summary")
    print(f"Vehicles: {len(vehicles)}")
    print(f"Successful events: {total_success}")
    print(f"Failed events: {total_failed}")


if __name__ == "__main__":
    main()
