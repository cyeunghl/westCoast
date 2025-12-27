import { useEffect, useRef, useState } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import type { Ride, Photo, MetricType } from '../lib/types';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapViewProps {
  ride: Ride | null;
  currentIndex: number;
  metric: MetricType;
  onPhotoClick: (photo: Photo) => void;
}

interface PhotoPreviewMarkerProps {
  photo: Photo;
  isNearby: boolean;
}

function PhotoPreviewMarker({ photo, isNearby }: PhotoPreviewMarkerProps) {
  const markerRef = useRef<HTMLDivElement>(null);
  const [previewStyle, setPreviewStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const updatePosition = () => {
      if (!markerRef.current) return;

      const rect = markerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Preview dimensions (approximate)
      const previewWidth = Math.min(Math.max(viewportWidth * 0.3, 250), 400);
      const previewHeight = viewportHeight * 0.4;

      // Calculate available space in each direction
      const spaceAbove = rect.top;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceLeft = rect.left;
      const spaceRight = viewportWidth - rect.right;

      // Determine best position
      let position: React.CSSProperties = {};

      // Prefer above, but check if there's enough space
      if (spaceAbove >= previewHeight + 20) {
        // Position above
        position = {
          bottom: 'calc(100% + 12px)',
          left: '50%',
          transform: 'translateX(-50%)',
        };
      } else if (spaceBelow >= previewHeight + 20) {
        // Position below
        position = {
          top: 'calc(100% + 12px)',
          left: '50%',
          transform: 'translateX(-50%)',
        };
      } else if (spaceRight >= previewWidth + 20) {
        // Position to the right
        position = {
          left: 'calc(100% + 12px)',
          top: '50%',
          transform: 'translateY(-50%)',
        };
      } else if (spaceLeft >= previewWidth + 20) {
        // Position to the left
        position = {
          right: 'calc(100% + 12px)',
          top: '50%',
          transform: 'translateY(-50%)',
        };
      } else {
        // Default to above and let it clip
        position = {
          bottom: 'calc(100% + 12px)',
          left: '50%',
          transform: 'translateX(-50%)',
        };
      }

      setPreviewStyle(position);
    };

    // Update on mount and when hovering
    const marker = markerRef.current;
    if (marker) {
      marker.addEventListener('mouseenter', updatePosition);
      updatePosition(); // Initial calculation
    }

    return () => {
      if (marker) {
        marker.removeEventListener('mouseenter', updatePosition);
      }
    };
  }, []);

  return (
    <div ref={markerRef} className="relative group">
      <div
        className="rounded-full transition-all duration-300 group-hover:scale-150"
        style={{
          width: isNearby ? '28px' : '16px',
          height: isNearby ? '28px' : '16px',
          backgroundColor: '#fbbf24',
          border: isNearby ? '4px solid #ffffff' : '2px solid #ffffff',
          cursor: 'pointer',
          opacity: isNearby ? 1 : 0.4,
          boxShadow: isNearby
            ? '0 0 16px rgba(251, 191, 36, 1), 0 0 8px rgba(0, 0, 0, 0.8)'
            : '0 0 4px rgba(251, 191, 36, 0.6)'
        }}
      />
      {/* Photo preview with smart positioning */}
      <div
        className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50"
        style={{
          filter: 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.7))',
          pointerEvents: 'none',
          maxWidth: 'min(30vw, 400px)',
          minWidth: '250px',
          maxHeight: 'min(40vh, calc(100vh - 100px))',
          ...previewStyle,
        }}
      >
        <div
          style={{
            width: '100%',
            maxHeight: '40vh',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            borderRadius: '8px',
            border: '3px solid #ffffff',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src={`/photos/${photo.filename}`}
            alt="Photo preview"
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '40vh',
              objectFit: 'contain',
              display: 'block'
            }}
            onError={(e) => {
              console.error('Failed to load photo:', photo.filename);
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function MapView({ ride, currentIndex, metric, onPhotoClick }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    longitude: -123.3656,
    latitude: 48.4284,
    zoom: 11
  });

  // Update map viewport when ride changes - fit to bounds
  useEffect(() => {
    if (!ride || !ride.route.length) return;

    const timer = setTimeout(() => {
      if (!mapRef.current) return;

      // Filter valid coordinates
      const validPoints = ride.route.filter(p =>
        p.lat != null && p.lon != null &&
        !isNaN(p.lat) && !isNaN(p.lon)
      );

      if (validPoints.length === 0) return;

      // Calculate bounds for the route
      const lats = validPoints.map(p => p.lat);
      const lons = validPoints.map(p => p.lon);

      const bounds: [[number, number], [number, number]] = [
        [Math.min(...lons), Math.min(...lats)], // Southwest
        [Math.max(...lons), Math.max(...lats)]  // Northeast
      ];

      try {
        // Fit map to bounds with padding
        mapRef.current.fitBounds(bounds, {
          padding: { top: 40, bottom: 40, left: 40, right: 40 },
          duration: 200
        });
      } catch (e) {
        console.error('Error fitting bounds:', e);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [ride]);

  // Don't pan to current position - keep full route visible
  // Users can manually pan/zoom if they want to focus on current position

  if (!ride || !ride.route || ride.route.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div style={{ color: 'var(--color-foreground)', opacity: 0.6 }}>
          {!ride ? 'Select a ride to view' : 'No route data available'}
        </div>
      </div>
    );
  }

  // Filter out points with invalid coordinates
  const validRoute = ride.route.filter(p =>
    p.lat != null && p.lon != null &&
    !isNaN(p.lat) && !isNaN(p.lon) &&
    p.lat >= -90 && p.lat <= 90 &&
    p.lon >= -180 && p.lon <= 180
  );

  if (validRoute.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div style={{ color: 'var(--color-foreground)', opacity: 0.6 }}>No valid route coordinates</div>
      </div>
    );
  }

  // Convert route to GeoJSON LineString
  const routeGeoJSON = {
    type: 'Feature' as const,
    geometry: {
      type: 'LineString' as const,
      coordinates: validRoute.map(p => [p.lon, p.lat])
    },
    properties: {}
  };

  // Get start and end points
  const startPoint = validRoute[0];
  const endPoint = validRoute[validRoute.length - 1];

  // Get color based on metric
  const getMetricColor = (metricType: MetricType) => {
    switch (metricType) {
      case 'speed': return 'var(--color-speed)';
      case 'hr': return 'var(--color-heart-rate)';
      case 'power': return 'var(--color-power)';
      case 'elevation': return 'var(--color-elevation)';
    }
  };

  return (
    <div className="w-full h-full absolute inset-0">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiY2xhcmVuY2V5ZXVuZyIsImEiOiJjbTU1c3gyazUwMHpkMmpzYTMyb3RhYnU5In0.KVL7U3l6qC7n6dLSQqPRDg'}
        style={{ width: '100%', height: '100%', position: 'absolute' }}
      >
        {/* Breadcrumb trail (full route in white) */}
        <Source id="route-breadcrumb" type="geojson" data={routeGeoJSON}>
          <Layer
            id="route-breadcrumb-line"
            type="line"
            paint={{
              'line-color': '#ffffff',
              'line-width': 2.5,
              'line-opacity': 0.8
            }}
          />
        </Source>

        {/* Start marker */}
        <Marker
          longitude={startPoint.lon}
          latitude={startPoint.lat}
          anchor="center"
        >
          <div
            className="rounded-full border-2"
            style={{
              width: '10px',
              height: '10px',
              backgroundColor: getMetricColor(metric),
              borderColor: 'var(--color-background)',
              boxShadow: '0 0 0 2px rgba(0,0,0,0.3)'
            }}
          />
        </Marker>

        {/* End marker */}
        <Marker
          longitude={endPoint.lon}
          latitude={endPoint.lat}
          anchor="center"
        >
          <div
            className="rounded-full border-2"
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: getMetricColor(metric),
              borderColor: 'var(--color-foreground)',
              boxShadow: '0 0 8px rgba(0,0,0,0.5)'
            }}
          />
        </Marker>

        {/* Current position marker */}
        {ride.route[currentIndex] && (
          <Marker
            longitude={ride.route[currentIndex].lon}
            latitude={ride.route[currentIndex].lat}
            anchor="center"
          >
            <div
              className="rounded-full border-2 animate-pulse"
              style={{
                width: '14px',
                height: '14px',
                backgroundColor: getMetricColor(metric),
                borderColor: 'var(--color-foreground)',
                boxShadow: '0 0 12px rgba(255,255,255,0.8)'
              }}
            />
          </Marker>
        )}

        {/* Photo markers - show on timeline scrub */}
        {ride.photos && ride.photos.map((photo, idx) => {
          // Use route coordinates at the photo's routeIndex, not photo GPS
          // (photo GPS is often inaccurate)
          const routePoint = ride.route[photo.routeIndex];
          if (!routePoint) return null;

          // Calculate if we're near this photo on the timeline (within 5% of route)
          const photoProgress = photo.routeIndex / ride.route.length;
          const currentProgress = currentIndex / ride.route.length;
          const isNearby = Math.abs(photoProgress - currentProgress) < 0.05;

          return (
            <Marker
              key={`photo-${idx}`}
              longitude={routePoint.lon}
              latitude={routePoint.lat}
              anchor="center"
            >
              <PhotoPreviewMarker
                photo={photo}
                isNearby={isNearby}
              />
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}
