"""
Match photos to ride routes based on timestamp and GPS location.
"""
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from math import radians, cos, sin, asin, sqrt


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two GPS coordinates in meters."""
    R = 6371000  # Earth radius in meters
    phi1, phi2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlambda = radians(lon2 - lon1)

    a = sin(dphi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(dlambda / 2) ** 2
    c = 2 * asin(sqrt(a))

    return R * c


def find_nearest_route_point(photo: Dict, route: List[Dict]) -> int:
    """
    Find the nearest route point to a photo based on GPS location.
    Timestamp is ignored - purely spatial matching.

    Returns:
        Index of the nearest route point
    """
    if not photo.get('location'):
        return None

    best_index = 0
    best_distance = float('inf')

    for i, point in enumerate(route):
        if not point.get('lat') or not point.get('lon'):
            continue

        # Calculate spatial distance only
        spatial_distance = haversine_distance(
            photo['location']['lat'], photo['location']['lon'],
            point['lat'], point['lon']
        )

        if spatial_distance < best_distance:
            best_distance = spatial_distance
            best_index = i

    return best_index


def interpolate_metrics(route: List[Dict], index: int, timestamp: str) -> Dict:
    """
    Interpolate ride metrics at a specific point in the route.

    Returns:
        Dict with hr, power, speed, elevation, distance
    """
    point = route[index]

    return {
        'hr': point.get('hr'),
        'power': point.get('power'),
        'speed': point.get('speed', 0),
        'elevation': point.get('ele', 0),
        'distance': point.get('distance', 0)
    }


def match_photos_to_ride(ride_route: List[Dict], photos: List[Dict]) -> List[Dict]:
    """
    Match photos to a ride route using GPS location snapping.
    Ignores timestamp - purely GPS-based matching.

    Returns:
        List of matched photos with routeIndex and stats
    """
    if not ride_route:
        return []

    matched_photos = []

    for photo in photos:
        # Only match photos that have GPS coordinates
        if not photo.get('location'):
            continue

        route_index = find_nearest_route_point(photo, ride_route)

        if route_index is not None:
            stats = interpolate_metrics(ride_route, route_index, photo.get('timestamp', ''))

            matched_photo = {
                **photo,
                'routeIndex': route_index,
                'stats': stats
            }
            matched_photos.append(matched_photo)

    return matched_photos


if __name__ == '__main__':
    # Test matching
    from parse_fit import generate_mock_rides
    from extract_exif import process_photo_batch
    import os

    rides = generate_mock_rides(1)
    ride = rides[0]

    test_dir = '/Users/clarenceyeung/Downloads/20250514'
    if os.path.exists(test_dir):
        photos = process_photo_batch(test_dir)
        matched = match_photos_to_ride(ride['route'], photos)
        print(f"Matched {len(matched)} photos to ride")
        for photo in matched[:3]:
            print(f"  {photo['filename']} at {photo['stats']['distance']:.1f}km")
