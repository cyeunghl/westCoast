#!/usr/bin/env python3
"""
Main data processor for cycling trip visualization.

Generates mock ride data and matches photos to routes.
Outputs JSON file for React app consumption.
"""
import os
import json
import shutil
from pathlib import Path
import sys

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from parse_fit import generate_mock_rides, parse_fit_file
from extract_exif import process_photo_batch
from match_photos import match_photos_to_ride


def process_all_rides(use_mock=True, photo_dirs=None, fit_dir=None):
    """
    Process all rides and generate output JSON.

    Args:
        use_mock: If True, generate mock rides. If False, parse real FIT files.
        photo_dirs: List of directories containing photos
        fit_dir: Directory containing FIT files
    """
    if use_mock:
        print("Generating mock ride data...")
        rides = generate_mock_rides(num_rides=6)
        print(f"Generated {len(rides)} mock rides")
    else:
        print("Parsing FIT files...")
        if fit_dir is None:
            fit_dir = '/Users/clarenceyeung/Downloads/cycling-viz/files'

        rides = []
        # Scan for FIT files
        fit_files = sorted([f for f in os.listdir(fit_dir) if f.endswith('.fit')])
        print(f"Found {len(fit_files)} FIT files in {fit_dir}")

        for i, file in enumerate(fit_files):
            print(f"Parsing {file}...")
            ride_data = parse_fit_file(os.path.join(fit_dir, file))
            if ride_data and ride_data.get('route'):
                # Extract date from filename (format: YYYY-MM-DDTHH-MM-SSZ-ID.fit)
                date_str = file.split('T')[0]
                ride_id = file.replace('.fit', '')

                ride_data['id'] = ride_id
                ride_data['date'] = date_str
                ride_data['name'] = f"Ride {i+1}: {date_str}"

                rides.append(ride_data)
                print(f"  Loaded: {ride_data['summary']['distance']:.1f}km, {len(ride_data['route'])} points")
            else:
                print(f"  Skipped (no route data)")

        # Sort rides by start time
        rides.sort(key=lambda r: r['route'][0]['time'] if r.get('route') and len(r['route']) > 0 else '9999-12-31')

        # Renumber rides after sorting
        for i, ride in enumerate(rides):
            ride['name'] = f"Ride {i+1}: {ride['date']}"

    # Process photos
    if photo_dirs is None:
        photo_dirs = [
            '/Users/clarenceyeung/Downloads/cycling-viz/public/photos'
        ]

    all_photos = []
    for photo_dir in photo_dirs:
        if os.path.exists(photo_dir):
            print(f"Processing photos from {photo_dir}...")
            photos = process_photo_batch(photo_dir)
            all_photos.extend(photos)
            print(f"  Found {len(photos)} photos")

    print(f"Total photos: {len(all_photos)}")

    # Match photos to rides - use GPS location snapping
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

    # Initialize empty photo lists for all rides
    for ride in rides:
        ride['photos'] = []

    # For each photo with GPS, find the closest ride route point
    for photo in all_photos:
        if not photo.get('location'):
            continue

        # Find the ride with the closest route point to this photo
        best_ride = None
        best_distance = float('inf')

        for ride in rides:
            if not ride['route']:
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

        # Only match photos that are within 1km of any route point
        if best_ride and best_distance < 1000:  # 1km threshold
            matched_photos = match_photos_to_ride(best_ride['route'], [photo])
            if matched_photos:
                best_ride['photos'].append(matched_photos[0])

    # Print results
    for ride in rides:
        if ride['photos']:
            print(f"  {ride['name']}: {len(ride['photos'])} photos")

    # Downsample route points for performance (keep every 10th point + photo points)
    # This reduces JSON size and improves map rendering
    for ride in rides:
        original_count = len(ride['route'])
        original_route = ride['route']

        # Collect indices of points with photos
        photo_indices = set(photo['routeIndex'] for photo in ride['photos'])

        # Keep first, last, every 10th point, AND photo points
        sampled_route = []
        old_to_new_index = {}  # Map old indices to new indices

        new_idx = 0
        for i in range(len(original_route)):
            if i == 0 or i == len(original_route) - 1 or i % 10 == 0 or i in photo_indices:
                sampled_route.append(original_route[i])
                old_to_new_index[i] = new_idx
                new_idx += 1

        # Update photo routeIndex to point to downsampled route
        for photo in ride['photos']:
            old_idx = photo['routeIndex']
            photo['routeIndex'] = old_to_new_index[old_idx]

        ride['route'] = sampled_route
        print(f"  Downsampled route: {original_count} → {len(sampled_route)} points ({len(photo_indices)} photo points preserved)")

    # Write output JSON
    output_data = {'rides': rides}
    output_path = Path(__file__).parent.parent / 'public' / 'data' / 'rides.json'
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w') as f:
        json.dump(output_data, f, indent=2)

    print(f"\nOutput written to {output_path}")
    print(f"Total rides: {len(rides)}")
    print(f"Total photos matched: {sum(len(r['photos']) for r in rides)}")

    # Copy photos to public directory
    print("\nCopying photos to public directory...")
    photos_out_dir = Path(__file__).parent.parent / 'public' / 'photos'
    photos_out_dir.mkdir(parents=True, exist_ok=True)

    copied_count = 0
    skipped_count = 0
    for ride in rides:
        for photo in ride['photos']:
            # Find source photo
            found = False
            for photo_dir in photo_dirs:
                src_path = os.path.join(photo_dir, photo['filename'])
                if os.path.exists(src_path):
                    dst_path = photos_out_dir / photo['filename']
                    if not dst_path.exists():
                        shutil.copy2(src_path, dst_path)
                        copied_count += 1
                    else:
                        skipped_count += 1
                    found = True
                    break
            if not found:
                print(f"  WARNING: Photo not found: {photo['filename']}")

    if skipped_count > 0:
        print(f"Copied {copied_count} new photos, skipped {skipped_count} existing photos")
    else:
        print(f"Copied {copied_count} photos to {photos_out_dir}")

    return rides


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Process cycling ride data')
    parser.add_argument('--real', action='store_true', help='Use real FIT files instead of mock data')
    parser.add_argument('--photos', nargs='+', help='Directories containing photos')
    parser.add_argument('--fit-dir', help='Directory containing FIT files')

    args = parser.parse_args()

    rides = process_all_rides(
        use_mock=not args.real,
        photo_dirs=args.photos,
        fit_dir=args.fit_dir
    )

    print("\nDone! Run the React app to visualize the rides.")
