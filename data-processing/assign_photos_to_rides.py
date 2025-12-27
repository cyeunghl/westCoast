#!/usr/bin/env python3
"""
Assign photos to rides based on GPS location snapping.
Outputs a CSV with photo-to-ride assignments.
"""
import os
import csv
import json
from pathlib import Path
from extract_exif import process_photo_batch


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two GPS coordinates in meters."""
    from math import radians, cos, sin, asin, sqrt
    R = 6371000  # Earth radius in meters
    phi1, phi2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlambda = radians(lon2 - lon1)

    a = sin(dphi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(dlambda / 2) ** 2
    c = 2 * asin(sqrt(a))

    return R * c


def assign_photos_to_rides():
    """Load rides and photos, assign each photo to a ride via GPS snapping."""

    # Load rides data
    rides_json = Path(__file__).parent.parent / 'public' / 'data' / 'rides.json'
    with open(rides_json, 'r') as f:
        data = json.load(f)
        rides = data['rides']

    print(f"Loaded {len(rides)} rides")

    # Process photos
    photo_dir = Path(__file__).parent.parent / 'public' / 'photos'
    photos = process_photo_batch(str(photo_dir))

    print(f"Found {len(photos)} photos")

    # Assign each photo to a ride based on GPS location
    assignments = []

    for photo in photos:
        if not photo.get('location'):
            assignments.append({
                'filename': photo['filename'],
                'timestamp': photo.get('timestamp', ''),
                'latitude': None,
                'longitude': None,
                'assigned_ride': 'NO_GPS',
                'ride_date': '',
                'ride_start': '',
                'ride_end': '',
                'distance_meters': None
            })
            continue

        # Find the ride with the closest route point to this photo
        best_ride = None
        best_distance = float('inf')

        for ride in rides:
            if not ride.get('route') or len(ride['route']) == 0:
                continue

            # Find closest point in this ride's route
            for point in ride['route']:
                if not point.get('lat') or not point.get('lon'):
                    continue

                distance = haversine_distance(
                    photo['location']['lat'], photo['location']['lon'],
                    point['lat'], point['lon']
                )

                if distance < best_distance:
                    best_distance = distance
                    best_ride = ride

        # Record assignment
        if best_ride and best_distance < 1000:  # 1km threshold
            ride_start_str = best_ride['route'][0]['time']
            ride_end_str = best_ride['route'][-1]['time']

            assignments.append({
                'filename': photo['filename'],
                'timestamp': photo.get('timestamp', ''),
                'latitude': photo['location']['lat'],
                'longitude': photo['location']['lon'],
                'assigned_ride': best_ride['name'],
                'ride_date': best_ride['date'],
                'ride_start': ride_start_str,
                'ride_end': ride_end_str,
                'distance_meters': round(best_distance, 1)
            })
        else:
            assignments.append({
                'filename': photo['filename'],
                'timestamp': photo.get('timestamp', ''),
                'latitude': photo['location']['lat'],
                'longitude': photo['location']['lon'],
                'assigned_ride': 'NO_MATCH' if best_ride is None else 'TOO_FAR',
                'ride_date': '',
                'ride_start': '',
                'ride_end': '',
                'distance_meters': round(best_distance, 1) if best_distance != float('inf') else None
            })

    # Write to CSV
    output_csv = Path(__file__).parent.parent / 'photo_ride_assignments.csv'
    with open(output_csv, 'w', newline='') as f:
        fieldnames = [
            'filename', 'timestamp', 'latitude', 'longitude',
            'assigned_ride', 'ride_date', 'ride_start', 'ride_end', 'distance_meters'
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(assignments)

    print(f"\nWrote photo-to-ride assignments to {output_csv}")

    # Print summary
    matched_count = sum(1 for a in assignments if a['assigned_ride'] not in ['NO_GPS', 'NO_MATCH', 'TOO_FAR'])
    print(f"\nSummary:")
    print(f"  Total photos: {len(assignments)}")
    print(f"  Matched to rides: {matched_count}")
    print(f"  Unmatched: {len(assignments) - matched_count}")

    # Breakdown by ride
    print("\nPhotos per ride:")
    ride_counts = {}
    for a in assignments:
        ride_name = a['assigned_ride']
        ride_counts[ride_name] = ride_counts.get(ride_name, 0) + 1

    for ride_name in sorted(ride_counts.keys()):
        print(f"  {ride_name}: {ride_counts[ride_name]}")

    return assignments


if __name__ == '__main__':
    assign_photos_to_rides()
