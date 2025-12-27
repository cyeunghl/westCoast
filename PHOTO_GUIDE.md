# Photo Processing Guide

## How to Process Photos with Your Cycling Data

### Step 1: Prepare Your Photos

1. **Extract photos from Google Photos** or your photo folder
2. Place photos in a folder, for example:
   ```
   /Users/clarenceyeung/Downloads/trip-photos/
   ```

### Step 2: Process Photos with FIT Files

Run the data processor with the `--photos` flag:

```bash
cd /Users/clarenceyeung/Downloads/cycling-viz/data-processing
python process_rides.py --real --photos /path/to/your/photos
```

**Example with multiple photo folders:**
```bash
python process_rides.py --real --photos \
  /Users/clarenceyeung/Downloads/trip-photos/day1 \
  /Users/clarenceyeung/Downloads/trip-photos/day2 \
  /Users/clarenceyeung/Downloads/trip-photos/day3
```

### How Photo Matching Works

The system matches photos to rides using:

1. **Timestamp matching**: Photos are matched to rides based on when they were taken
   - Looks for photos within ±2 hours of the ride time

2. **GPS matching** (if available): If photos have GPS EXIF data
   - Matches photos within 100m of the route
   - Finds the nearest point on the route

3. **Stat interpolation**: For each photo, the system calculates:
   - Speed at that moment
   - Elevation
   - Distance from start
   - Heart rate (if available)
   - Power (if available)

### Step 3: View Photos in the App

Once processed, photos will:
- Appear as white dots on the map
- Show in the ride sidebar (photo count)
- Open in a modal when clicked
- Display all stats from that moment in the ride

### Supported Photo Formats

- JPG/JPEG
- PNG
- HEIC (iPhone photos)

### EXIF Data

The system extracts:
- **GPS coordinates** (if available)
- **Timestamp** (when photo was taken)
- **Camera info** (optional)

### Tips for Best Results

1. **Use photos with GPS**: iPhone and Android photos usually include GPS
2. **Check timestamps**: Make sure your camera's clock is set correctly
3. **Organize by date**: Keep photos in date-based folders for easier processing

### Example: Processing May 2022 Trip

```bash
# If you have photos in /Users/clarenceyeung/Downloads/20250514
cd data-processing
python process_rides.py --real --photos /Users/clarenceyeung/Downloads/20250514

# Or for Google Photos export (usually in dated folders)
python process_rides.py --real --photos \
  /Users/clarenceyeung/Downloads/GooglePhotos/2022-05-14 \
  /Users/clarenceyeung/Downloads/GooglePhotos/2022-05-15 \
  /Users/clarenceyeung/Downloads/GooglePhotos/2022-05-16
```

### Troubleshooting

**No photos matched:**
- Check that photo timestamps match your ride dates
- Verify photos are in the correct folder
- Make sure EXIF data exists (use `exiftool` or Preview.app to check)

**Wrong photos matched:**
- Check your camera's timezone settings
- Verify GPS coordinates in EXIF data

**Photos not showing:**
- Restart the dev server after reprocessing
- Check browser console for errors
- Verify photos were copied to `public/photos/`
