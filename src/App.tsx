import { useState, useEffect } from 'react';
import type { Ride, Photo, MetricType } from './lib/types.js';
import MapView from './components/MapView';
import Dashboard from './components/Dashboard';
import MetricToggle from './components/MetricToggle';
import TimelineScrubber from './components/TimelineScrubber';
import PhotoModal from './components/PhotoModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { LayoutGrid, Route } from 'lucide-react';
import './App.css';

type ViewMode = 'dashboard' | 'detail';

function App() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('speed');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

  console.log('App rendering, loading:', loading, 'rides:', rides.length, 'selectedRide:', selectedRide?.name);

  useEffect(() => {
    console.log('Fetching rides data...');
    fetch('/data/rides.json')
      .then(res => {
        console.log('Got response:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Got data:', data.rides?.length, 'rides');
        if (data.rides && data.rides.length > 0) {
          setRides(data.rides);
          // Only set selected ride if we're not in dashboard mode
          // This prevents breaking when refreshing on dashboard view
          setSelectedRide(data.rides[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading rides:', err);
        setLoading(false);
      });
  }, []);

  // Auto-play animation (30s total duration)
  useEffect(() => {
    if (!isPlaying || !selectedRide) return;

    const totalPoints = selectedRide.route.length;
    const intervalMs = 30000 / totalPoints; // 30 seconds total

    const interval = setInterval(() => {
      setCurrentRouteIndex(prevIndex => {
        if (prevIndex >= totalPoints - 1) {
          setIsPlaying(false);
          return 0;
        }
        return prevIndex + 1;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, selectedRide]);

  // Reset playhead when ride changes
  useEffect(() => {
    setCurrentRouteIndex(0);
    setIsPlaying(false);
  }, [selectedRide]);

  // Ensure we have a selected ride when switching to detail view
  useEffect(() => {
    if (viewMode === 'detail' && !selectedRide && rides.length > 0) {
      setSelectedRide(rides[0]);
    }
  }, [viewMode, selectedRide, rides]);

  // Ensure currentRouteIndex is valid for the current ride
  useEffect(() => {
    if (selectedRide && currentRouteIndex >= selectedRide.route.length) {
      setCurrentRouteIndex(Math.max(0, selectedRide.route.length - 1));
    }
  }, [selectedRide, currentRouteIndex]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onPlayPause: () => {
      if (viewMode === 'detail' && selectedRide) {
        setIsPlaying(prev => !prev);
      }
    },
    onSeekForward: () => {
      if (!selectedRide || viewMode !== 'detail') return;
      setCurrentRouteIndex(prev => Math.min(prev + Math.floor(selectedRide.route.length / 60), selectedRide.route.length - 1));
    },
    onSeekBackward: () => {
      if (!selectedRide || viewMode !== 'detail') return;
      setCurrentRouteIndex(prev => Math.max(prev - Math.floor(selectedRide.route.length / 60), 0));
    },
    onToggleMetric: (metric: MetricType) => {
      if (viewMode === 'detail') {
        setSelectedMetric(metric);
      }
    },
    isModalOpen: selectedPhoto !== null
  });

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div style={{ color: 'var(--color-foreground)' }}>Loading rides...</div>
      </div>
    );
  }

  if (rides.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div style={{ color: 'var(--color-foreground)' }}>No rides found</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}>
      {/* Top Banner */}
      <div className="border-b px-6 py-2.5 flex items-center justify-between" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}>
        <div className="flex items-center gap-8">
          <h1 className="text-lg font-semibold tracking-tight">West Coast Cycling Trip</h1>
          <div className="flex gap-1 border rounded-lg p-1" style={{ borderColor: 'var(--color-border)' }}>
            <button
              onClick={() => setViewMode('dashboard')}
              className="px-3 py-1 text-xs rounded flex items-center gap-1.5 transition-colors"
              style={
                viewMode === 'dashboard'
                  ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-background)' }
                  : { backgroundColor: 'transparent', color: 'var(--color-foreground)', opacity: 0.6 }
              }
            >
              <LayoutGrid size={14} />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setViewMode('detail')}
              className="px-3 py-1 text-xs rounded flex items-center gap-1.5 transition-colors"
              style={
                viewMode === 'detail'
                  ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-background)' }
                  : { backgroundColor: 'transparent', color: 'var(--color-foreground)', opacity: 0.6 }
              }
              disabled={!selectedRide}
            >
              <Route size={14} />
              <span>Detail</span>
            </button>
          </div>
        </div>
        {viewMode === 'detail' && selectedRide && (
          <div className="flex gap-6 text-xs tabular-nums" style={{ color: 'var(--color-foreground)', opacity: 0.7 }}>
            <span>{selectedRide.summary.distance.toFixed(1)} km</span>
            <span>{selectedRide.summary.elevationGain.toFixed(0)} m</span>
            <span>{Math.floor(selectedRide.summary.duration / 3600)}h {Math.floor((selectedRide.summary.duration % 3600) / 60)}m</span>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {viewMode === 'dashboard' ? (
          /* Dashboard view - all rides as colored breadcrumbs */
          <div className="flex-1 relative">
            <Dashboard
              rides={rides}
              onRideClick={(ride) => {
                setSelectedRide(ride);
                setViewMode('detail');
              }}
            />
          </div>
        ) : (
          /* Detail view - single ride with timeline */
          <>
            {/* Ride list sidebar */}
            <div className="hidden md:block md:w-64 lg:w-80 border-r overflow-y-auto" style={{ borderColor: 'var(--color-border)' }}>
              <div className="p-4">
                <h2 className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--color-foreground)', opacity: 0.6 }}>Rides</h2>
                <div className="space-y-2">
                  {rides.map(ride => (
                    <button
                      key={ride.id}
                      onClick={() => setSelectedRide(ride)}
                      className="w-full text-left p-3 rounded-lg transition-colors border"
                      style={
                        selectedRide && ride.id === selectedRide.id
                          ? { backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)', borderColor: 'var(--color-accent)' }
                          : { backgroundColor: 'transparent', borderColor: 'transparent' }
                      }
                    >
                      <div className="text-sm font-medium">{ride.name}</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--color-foreground)', opacity: 0.6 }}>
                        {ride.date} · {ride.summary.distance.toFixed(0)}km · {ride.summary.elevationGain.toFixed(0)}m
                      </div>
                      <div className="text-xs mt-1" style={{ color: 'var(--color-foreground)', opacity: 0.4 }}>
                        {ride.photos.length} photos
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Map and timeline container */}
            {selectedRide && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Map view */}
                <div className="flex-1 relative">
                  <MapView
                    ride={selectedRide}
                    currentIndex={currentRouteIndex}
                    metric={selectedMetric}
                    onPhotoClick={setSelectedPhoto}
                  />
                </div>

                {/* Timeline scrubber */}
                <TimelineScrubber
                  ride={selectedRide}
                  currentIndex={currentRouteIndex}
                  onSeek={setCurrentRouteIndex}
                  isPlaying={isPlaying}
                  onPlayPause={() => setIsPlaying(!isPlaying)}
                />

                {/* Metric toggle */}
                <div className="border-t px-4 md:px-6 py-3" style={{ borderColor: 'var(--color-border)' }}>
                  <MetricToggle
                    selected={selectedMetric}
                    onChange={setSelectedMetric}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Photo modal */}
      {selectedPhoto && selectedRide && (
        <PhotoModal
          photo={selectedPhoto}
          allPhotos={selectedRide.photos}
          onClose={() => setSelectedPhoto(null)}
          onNext={() => {
            const currentIndex = selectedRide.photos.findIndex(p => p.filename === selectedPhoto.filename);
            if (currentIndex < selectedRide.photos.length - 1) {
              setSelectedPhoto(selectedRide.photos[currentIndex + 1]);
            }
          }}
          onPrev={() => {
            const currentIndex = selectedRide.photos.findIndex(p => p.filename === selectedPhoto.filename);
            if (currentIndex > 0) {
              setSelectedPhoto(selectedRide.photos[currentIndex - 1]);
            }
          }}
        />
      )}
    </div>
  );
}

export default App;
