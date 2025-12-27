# Cycling Trip Visualization

An interactive web application for browsing cycling trips with route visualization, photo integration, and performance metrics. Built with a minimal, Linear-inspired design aesthetic.

## Features

- **Interactive Map**: Mapbox GL-powered route visualization with gradient coloring based on selected metric (speed, heart rate, power, or elevation)
- **Timeline Scrubber**: Elevation profile with playhead control for exploring the ride
- **Photo Integration**: Photos matched to route with automatic stat interpolation
- **Metric Toggle**: Switch between speed, heart rate, power, and elevation visualizations
- **Keyboard Shortcuts**: Space (play/pause), Arrow keys (seek), 1-4 (toggle metrics), Esc (close modal)
- **Minimal UI**: Dark mode design inspired by Linear app

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Mapping**: Mapbox GL JS, react-map-gl
- **Charts**: Recharts
- **Styling**: Tailwind CSS v4, OKLCH color space
- **Data Processing**: Python (FIT/TCX parser, EXIF extraction, photo-to-route matching)

## Development

### Prerequisites

- Node.js 18+
- Python 3.9+
- Mapbox access token

### Setup

1. Install dependencies:
```bash
npm install
```

2. Install Python dependencies for data processing:
```bash
cd data-processing
pip install -r requirements.txt
```

3. Create a `.env` file with your Mapbox token:
```
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

4. Start the dev server:
```bash
npm run dev
```

### Data Processing

The Python pipeline processes FIT/TCX files and photos:

```bash
cd data-processing
python process_rides.py
```

This generates:
- `public/data/rides.json` - Processed ride data
- `public/photos/` - Optimized photos

## Deployment (Vercel)

### Initial Setup

1. Push to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. Deploy to Vercel:
   - Visit [vercel.com](https://vercel.com) and import your GitHub repository
   - Configure environment variable: `VITE_MAPBOX_TOKEN`
   - Deploy

### Auto-Deploy

Vercel will automatically deploy on every push to the main branch.

## Project Structure

```
cycling-viz/
├── src/
│   ├── components/       # React components
│   │   ├── MapView.tsx
│   │   ├── TimelineScrubber.tsx
│   │   ├── PhotoModal.tsx
│   │   └── MetricToggle.tsx
│   ├── hooks/           # Custom hooks
│   │   └── useKeyboardShortcuts.ts
│   ├── lib/             # Types and utilities
│   │   └── types.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
│   ├── data/            # Generated ride data
│   └── photos/          # Ride photos
├── data-processing/     # Python data pipeline
│   ├── process_rides.py
│   ├── parse_fit.py
│   ├── match_photos.py
│   └── extract_exif.py
└── vercel.json          # Deployment config
```

## Keyboard Shortcuts

- **Space**: Play/pause animation
- **Left/Right Arrow**: Seek backward/forward (~5 seconds)
- **1**: Toggle speed metric
- **2**: Toggle heart rate metric
- **3**: Toggle power metric
- **4**: Toggle elevation metric
- **Esc**: Close photo modal
- **Arrow keys** (in modal): Navigate between photos

## Design System

### Colors (OKLCH)
- Background: `oklch(0.15 0 0)` - Near black
- Foreground: `oklch(0.9 0 0)` - Near white
- Accent: `oklch(0.65 0.15 250)` - Desaturated blue
- Border: `oklch(0.25 0 0)` - Dark gray

### Metrics
- Speed: Green `oklch(0.55 0.15 145)`
- Heart Rate: Red `oklch(0.6 0.2 25)`
- Power: Amber `oklch(0.65 0.18 75)`
- Elevation: Indigo `oklch(0.6 0.18 270)`

## License

MIT
