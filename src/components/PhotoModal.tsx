import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';
import type { Photo } from '../lib/types';

interface PhotoModalProps {
  photo: Photo;
  allPhotos: Photo[];
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export default function PhotoModal({ photo, allPhotos, onClose, onNext, onPrev }: PhotoModalProps) {
  const currentIndex = allPhotos.findIndex(p => p.filename === photo.filename);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allPhotos.length - 1;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && hasPrev && onPrev) {
        onPrev();
      } else if (e.key === 'ArrowRight' && hasNext && onNext) {
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  // Format time
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Format distance (distance is already in km from the data)
  const formatDistance = (km: number) => {
    return `${km.toFixed(1)} km`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full transition-colors z-10"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: 'var(--color-foreground)'
        }}
      >
        <X size={24} />
      </button>

      {/* Navigation buttons */}
      {hasPrev && onPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-6 p-3 rounded-full transition-colors"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: 'var(--color-foreground)'
          }}
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {hasNext && onNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-6 p-3 rounded-full transition-colors"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: 'var(--color-foreground)'
          }}
        >
          <ChevronRight size={32} />
        </button>
      )}

      {/* Content */}
      <div
        className="flex items-center gap-8 max-w-7xl mx-auto px-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Photo */}
        <div className="flex-1 flex items-center justify-center">
          <img
            src={`/photos/${photo.filename}`}
            alt="Ride photo"
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
            style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)' }}
          />
        </div>

        {/* Stats panel */}
        <div
          className="w-64 p-6 rounded-lg flex-shrink-0"
          style={{
            backgroundColor: 'var(--color-background)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div className="space-y-4">
            {/* Time */}
            <div>
              <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--color-foreground)', opacity: 0.6 }}>
                Time
              </div>
              <div className="text-lg tabular-nums" style={{ color: 'var(--color-foreground)' }}>
                {formatTime(photo.timestamp)}
              </div>
            </div>

            {/* Location */}
            {photo.stats?.distance !== undefined && photo.stats?.distance !== null && (
              <div>
                <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--color-foreground)', opacity: 0.6 }}>
                  Location
                </div>
                <div className="text-lg tabular-nums" style={{ color: 'var(--color-foreground)' }}>
                  {formatDistance(photo.stats.distance)}
                </div>
              </div>
            )}

            <div style={{ height: '1px', backgroundColor: 'var(--color-border)' }} />

            {/* Speed */}
            {photo.stats?.speed !== undefined && photo.stats?.speed !== null && (
              <div>
                <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--color-speed)', opacity: 0.8 }}>
                  Speed
                </div>
                <div className="text-lg tabular-nums" style={{ color: 'var(--color-foreground)' }}>
                  {Number(photo.stats.speed).toFixed(1)} km/h
                </div>
              </div>
            )}

            {/* Heart Rate */}
            {photo.stats?.hr !== undefined && photo.stats?.hr !== null && (
              <div>
                <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--color-heart-rate)', opacity: 0.8 }}>
                  Heart Rate
                </div>
                <div className="text-lg tabular-nums" style={{ color: 'var(--color-foreground)' }}>
                  {Number(photo.stats.hr).toFixed(0)} bpm
                </div>
              </div>
            )}

            {/* Power */}
            {photo.stats?.power !== undefined && photo.stats?.power !== null && (
              <div>
                <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--color-power)', opacity: 0.8 }}>
                  Power
                </div>
                <div className="text-lg tabular-nums" style={{ color: 'var(--color-foreground)' }}>
                  {Number(photo.stats.power).toFixed(0)} W
                </div>
              </div>
            )}

            {/* Elevation */}
            {photo.stats?.elevation !== undefined && photo.stats?.elevation !== null && (
              <div>
                <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--color-elevation)', opacity: 0.8 }}>
                  Elevation
                </div>
                <div className="text-lg tabular-nums" style={{ color: 'var(--color-foreground)' }}>
                  {Number(photo.stats.elevation).toFixed(0)} m
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
