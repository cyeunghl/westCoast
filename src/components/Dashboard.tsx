import { useEffect, useRef, useState } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import type { Ride } from '../lib/types';
import { Circle, MapPin } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

interface DashboardProps {
  rides: Ride[];
  onRideClick: (ride: Ride) => void;
}

// Generate distinct colors for each ride
const generateColor = (index: number, total: number) => {
  const hue = (index * 360) / total;
  return `hsl(${hue}, 70%, 60%)`;
};

export default function Dashboard({ rides, onRideClick }: DashboardProps) {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    longitude: -123.3656,
    latitude: 48.4284,
    zoom: 8
  });

  // Calculate bounds for all rides - fit to bounds
  useEffect(() => {
    if (rides.length === 0) return;

    const timer = setTimeout(() => {
      if (!mapRef.current) return;

      const allPoints = rides.flatMap(ride =>
        ride.route.filter(p =>
          p.lat != null && p.lon != null &&
          !isNaN(p.lat) && !isNaN(p.lon)
        )
      );

      if (allPoints.length === 0) return;

      const lats = allPoints.map(p => p.lat);
      const lons = allPoints.map(p => p.lon);

      const bounds: [[number, number], [number, number]] = [
        [Math.min(...lons), Math.min(...lats)], // Southwest
        [Math.max(...lons), Math.max(...lats)]  // Northeast
      ];

      try {
        // Fit map to bounds with padding
        mapRef.current.fitBounds(bounds, {
          padding: { top: 60, bottom: 60, left: 60, right: 60 },
          duration: 300
        });
      } catch (e) {
        console.error('Error fitting bounds:', e);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [rides]);

  if (rides.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div style={{ color: 'var(--color-foreground)', opacity: 0.6 }}>No rides available</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full absolute inset-0">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiY2xhcmVuY2V5ZXVuZyIsImEiOiJjbTU1c3gyazUwMHpkMmpzYTMyb3RhYnU5In0.KVL7U3l6qC7n6dLSQqPRDg'}
        style={{ width: '100%', height: '100%', position: 'absolute' }}
        interactiveLayerIds={rides.map((_, idx) => `route-${idx}`)}
        onClick={(e) => {
          if (e.features && e.features.length > 0) {
            const rideIndex = parseInt(e.features[0].layer.id.replace('route-', ''));
            onRideClick(rides[rideIndex]);
          }
        }}
      >
        {/* Render all routes as breadcrumbs */}
        {rides.map((ride, rideIndex) => {
          const validRoute = ride.route.filter(p =>
            p.lat != null && p.lon != null &&
            !isNaN(p.lat) && !isNaN(p.lon) &&
            p.lat >= -90 && p.lat <= 90 &&
            p.lon >= -180 && p.lon <= 180
          );

          if (validRoute.length === 0) return null;

          const routeGeoJSON = {
            type: 'Feature' as const,
            geometry: {
              type: 'LineString' as const,
              coordinates: validRoute.map(p => [p.lon, p.lat])
            },
            properties: {
              rideIndex,
              name: ride.name,
              distance: ride.summary.distance
            }
          };

          const color = generateColor(rideIndex, rides.length);
          const startPoint = validRoute[0];
          const endPoint = validRoute[validRoute.length - 1];

          return (
            <div key={ride.id}>
              <Source id={`route-source-${rideIndex}`} type="geojson" data={routeGeoJSON}>
                <Layer
                  id={`route-${rideIndex}`}
                  type="line"
                  paint={{
                    'line-color': color,
                    'line-width': 2,
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
                    backgroundColor: color,
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
                    backgroundColor: color,
                    borderColor: 'var(--color-foreground)',
                    boxShadow: '0 0 8px rgba(0,0,0,0.5)'
                  }}
                />
              </Marker>
            </div>
          );
        })}
      </Map>

      {/* Legend */}
      <div
        className="absolute bottom-4 left-4 p-4 rounded-lg max-h-96 overflow-y-auto"
        style={{
          backgroundColor: 'rgba(10, 10, 10, 0.9)',
          borderColor: 'var(--color-border)',
          border: '1px solid'
        }}
      >
        <div className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--color-foreground)', opacity: 0.6 }}>
          All Rides ({rides.length})
        </div>
        <div className="space-y-2">
          {rides.map((ride, idx) => (
            <button
              key={ride.id}
              onClick={() => onRideClick(ride)}
              className="flex items-center gap-2 text-xs hover:opacity-75 transition-opacity w-full text-left"
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: generateColor(idx, rides.length) }}
              />
              <span style={{ color: 'var(--color-foreground)' }}>{ride.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
