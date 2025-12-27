"""
Extract EXIF metadata from photos.
"""
import os
from typing import Dict, List, Optional
from datetime import datetime
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import exifread


def convert_to_degrees(value):
    """Convert GPS coordinates to degrees in float format."""
    d = float(value[0].num) / float(value[0].den)
    m = float(value[1].num) / float(value[1].den)
    s = float(value[2].num) / float(value[2].den)
    return d + (m / 60.0) + (s / 3600.0)


def extract_photo_metadata(image_path: str) -> Optional[Dict]:
    """
    Extract metadata from a single photo.

    Returns:
        Dict with filename, timestamp, location (if available)
    """
    try:
        with open(image_path, 'rb') as f:
            tags = exifread.process_file(f, details=False)

        metadata = {
            'filename': os.path.basename(image_path),
            'timestamp': None,
            'location': None
        }

        # Extract timestamp
        datetime_tag = tags.get('EXIF DateTimeOriginal') or tags.get('Image DateTime')
        if datetime_tag:
            try:
                from datetime import timezone
                dt = datetime.strptime(str(datetime_tag), '%Y:%m:%d %H:%M:%S')
                # Assume UTC timezone
                dt = dt.replace(tzinfo=timezone.utc)
                metadata['timestamp'] = dt.isoformat()
            except ValueError:
                pass

        # Extract GPS coordinates
        gps_latitude = tags.get('GPS GPSLatitude')
        gps_latitude_ref = tags.get('GPS GPSLatitudeRef')
        gps_longitude = tags.get('GPS GPSLongitude')
        gps_longitude_ref = tags.get('GPS GPSLongitudeRef')

        if all([gps_latitude, gps_latitude_ref, gps_longitude, gps_longitude_ref]):
            try:
                lat = convert_to_degrees(gps_latitude.values)
                if str(gps_latitude_ref) == 'S':
                    lat = -lat

                lon = convert_to_degrees(gps_longitude.values)
                if str(gps_longitude_ref) == 'W':
                    lon = -lon

                metadata['location'] = {
                    'lat': round(lat, 6),
                    'lon': round(lon, 6)
                }
            except Exception as e:
                print(f"Error extracting GPS from {image_path}: {e}")

        return metadata

    except Exception as e:
        print(f"Error reading {image_path}: {e}")
        return None


def process_photo_batch(directory: str) -> List[Dict]:
    """
    Process all photos in a directory.

    Returns:
        List of photo metadata dicts
    """
    photos = []
    valid_extensions = {'.jpg', '.jpeg', '.png', '.heic'}

    for filename in os.listdir(directory):
        filepath = os.path.join(directory, filename)
        ext = os.path.splitext(filename)[1].lower()

        if os.path.isfile(filepath) and ext in valid_extensions:
            metadata = extract_photo_metadata(filepath)
            if metadata:
                photos.append(metadata)

    # Sort by timestamp
    photos.sort(key=lambda x: x['timestamp'] if x['timestamp'] else '')

    return photos


if __name__ == '__main__':
    # Test with 20250514 folder
    test_dir = '/Users/clarenceyeung/Downloads/20250514'
    if os.path.exists(test_dir):
        photos = process_photo_batch(test_dir)
        print(f"Found {len(photos)} photos")
        for photo in photos[:3]:
            print(f"  {photo['filename']}: {photo['timestamp']}, GPS: {photo['location']}")
