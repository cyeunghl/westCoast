"""
Parse FIT files and extract ride data.
Uses fitparse library to read Garmin FIT files.
"""
import json
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional
from math import radians, cos, sin, asin, sqrt
import random
import pytz


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two GPS coordinates in meters."""
    R = 6371000  # Earth radius in meters
    phi1, phi2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlambda = radians(lon2 - lon1)

    a = sin(dphi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(dlambda / 2) ** 2
    c = 2 * asin(sqrt(a))

    return R * c


def parse_fit_file(filepath: str) -> Dict:
    """
    Parse a FIT file and extract ride data.

    Returns:
        Dict with route points and summary stats
    """
    try:
        from fitparse import FitFile

        fitfile = FitFile(filepath)
        route_points = []

        for record in fitfile.get_messages('record'):
            point_data = {}
            for field in record:
                if field.name == 'position_lat':
                    point_data['lat'] = field.value * (180 / 2**31) if field.value else None
                elif field.name == 'position_long':
                    point_data['lon'] = field.value * (180 / 2**31) if field.value else None
                elif field.name == 'altitude':
                    point_data['ele'] = field.value
                elif field.name == 'timestamp':
                    if field.value:
                        # Ensure timezone-aware datetime (FIT timestamps are UTC)
                        dt = field.value
                        if dt.tzinfo is None:
                            dt = dt.replace(tzinfo=timezone.utc)
                        point_data['time'] = dt.isoformat()
                    else:
                        point_data['time'] = None
                elif field.name == 'heart_rate':
                    point_data['hr'] = field.value
                elif field.name == 'power':
                    point_data['power'] = field.value
                elif field.name == 'speed':
                    point_data['speed'] = field.value * 3.6 if field.value else 0  # m/s to km/h
                elif field.name == 'distance':
                    point_data['distance'] = field.value / 1000 if field.value else 0  # m to km

            if point_data.get('lat') and point_data.get('lon'):
                route_points.append(point_data)

        # Calculate gradients and speeds if not provided
        for i, point in enumerate(route_points):
            if 'gradient' not in point and i > 0:
                prev = route_points[i-1]
                ele_diff = point.get('ele', 0) - prev.get('ele', 0)
                dist_diff = (point.get('distance', 0) - prev.get('distance', 0)) * 1000  # km to m
                point['gradient'] = (ele_diff / dist_diff * 100) if dist_diff > 0 else 0
            else:
                point['gradient'] = 0

            # Ensure all required fields
            point.setdefault('hr', None)
            point.setdefault('power', None)
            point.setdefault('speed', 0)
            point.setdefault('distance', 0)
            point.setdefault('ele', 0)

        return {
            'route': route_points,
            'summary': calculate_summary(route_points)
        }

    except Exception as e:
        print(f"Error parsing FIT file {filepath}: {e}")
        return None


def calculate_summary(route_points: List[Dict]) -> Dict:
    """Calculate summary statistics from route points."""
    if not route_points:
        return {}

    total_distance = route_points[-1].get('distance', 0)

    # Calculate elevation gain
    elevation_gain = 0
    for i in range(1, len(route_points)):
        ele_diff = route_points[i].get('ele', 0) - route_points[i-1].get('ele', 0)
        if ele_diff > 0:
            elevation_gain += ele_diff

    # Calculate duration
    start_time = datetime.fromisoformat(route_points[0]['time'].replace('Z', '+00:00'))
    end_time = datetime.fromisoformat(route_points[-1]['time'].replace('Z', '+00:00'))
    duration = (end_time - start_time).total_seconds()

    # Calculate averages
    speeds = [p.get('speed', 0) for p in route_points if p.get('speed', 0) > 0]
    avg_speed = sum(speeds) / len(speeds) if speeds else 0

    hrs = [p.get('hr') for p in route_points if p.get('hr')]
    avg_hr = sum(hrs) / len(hrs) if hrs else None

    powers = [p.get('power') for p in route_points if p.get('power')]
    avg_power = sum(powers) / len(powers) if powers else None

    max_elevation = max([p.get('ele', 0) for p in route_points])

    return {
        'distance': total_distance,
        'elevationGain': elevation_gain,
        'duration': duration,
        'avgSpeed': avg_speed,
        'avgHr': avg_hr,
        'avgPower': avg_power,
        'maxElevation': max_elevation
    }


def generate_mock_rides(num_rides: int = 6) -> List[Dict]:
    """
    Generate mock ride data for testing.
    Creates realistic West Coast routes.
    """
    rides = []
    base_date = datetime(2022, 5, 14, 8, 0, 0, tzinfo=timezone.utc)

    # West Coast locations (Victoria BC area based on the sample TCX)
    start_locations = [
        {"lat": 48.116112, "lon": -123.434822, "name": "Victoria Waterfront"},
        {"lat": 48.428421, "lon": -123.365644, "name": "Sidney"},
        {"lat": 48.456946, "lon": -123.485551, "name": "Deep Cove"},
        {"lat": 48.462431, "lon": -123.318001, "name": "Swartz Bay"},
        {"lat": 48.651070, "lon": -123.421568, "name": "Salt Spring Island"},
        {"lat": 48.781111, "lon": -123.711944, "name": "Sooke"},
    ]

    for i in range(num_rides):
        start_loc = start_locations[i]
        ride_date = base_date.replace(day=14 + i)

        # Generate route points (simulate 2-4 hour ride)
        route_points = []
        num_points = random.randint(3600, 7200)  # 1 point per second
        distance = 0
        elevation = start_loc.get("elevation", 10)

        for j in range(num_points):
            # Simulate movement
            lat = start_loc["lat"] + (j / num_points) * random.uniform(-0.3, 0.3)
            lon = start_loc["lon"] + (j / num_points) * random.uniform(-0.3, 0.3)

            # Calculate distance from previous point
            if j > 0:
                dist_delta = haversine_distance(
                    route_points[-1]["lat"], route_points[-1]["lon"],
                    lat, lon
                ) / 1000  # convert to km
                distance += dist_delta

            # Simulate elevation changes (rolling hills)
            if j > 0:
                elevation += random.uniform(-2, 3)
                elevation = max(0, min(elevation, 500))  # Clamp between 0-500m

            # Simulate speed (10-35 km/h)
            speed = random.uniform(15, 30)

            # Simulate HR and power
            hr = random.randint(120, 180) if random.random() > 0.1 else None
            power = random.randint(150, 250) if random.random() > 0.3 else None

            # Calculate gradient
            if j > 0:
                ele_diff = elevation - route_points[-1]["ele"]
                dist_diff = dist_delta * 1000  # km to m
                gradient = (ele_diff / dist_diff * 100) if dist_diff > 0 else 0
            else:
                gradient = 0

            point = {
                "lat": round(lat, 6),
                "lon": round(lon, 6),
                "ele": round(elevation, 1),
                "time": (ride_date + timedelta(seconds=j)).isoformat(),
                "hr": hr,
                "power": power,
                "speed": round(speed, 1),
                "distance": round(distance, 2),
                "gradient": round(gradient, 1)
            }
            route_points.append(point)

        # Calculate summary
        elevation_gain = sum(
            max(0, route_points[i]["ele"] - route_points[i-1]["ele"])
            for i in range(1, len(route_points))
        )

        speeds = [p["speed"] for p in route_points if p["speed"] > 0]
        avg_speed = sum(speeds) / len(speeds) if speeds else 0

        hrs = [p["hr"] for p in route_points if p["hr"]]
        avg_hr = sum(hrs) / len(hrs) if hrs else None

        powers = [p["power"] for p in route_points if p["power"]]
        avg_power = sum(powers) / len(powers) if powers else None

        max_elevation = max(p["ele"] for p in route_points)

        ride = {
            "id": f"ride_{ride_date.strftime('%Y%m%d')}",
            "date": ride_date.strftime('%Y-%m-%d'),
            "name": f"Day {i+1}: {start_loc['name']}",
            "route": route_points,
            "photos": [],  # Will be filled by photo matcher
            "summary": {
                "distance": round(distance, 1),
                "elevationGain": round(elevation_gain, 0),
                "duration": num_points,
                "avgSpeed": round(avg_speed, 1),
                "avgHr": round(avg_hr) if avg_hr else None,
                "avgPower": round(avg_power) if avg_power else None,
                "maxElevation": round(max_elevation, 1)
            }
        }

        rides.append(ride)

    return rides


if __name__ == '__main__':
    # Test mock ride generation
    mock_rides = generate_mock_rides(6)
    print(f"Generated {len(mock_rides)} mock rides")
    for ride in mock_rides:
        print(f"  {ride['name']}: {ride['summary']['distance']}km, {ride['summary']['elevationGain']}m gain")
