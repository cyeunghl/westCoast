import { useEffect } from 'react';
import type { MetricType } from '../lib/types';

interface UseKeyboardShortcutsProps {
  onPlayPause: () => void;
  onSeekForward: () => void;
  onSeekBackward: () => void;
  onToggleMetric: (metric: MetricType) => void;
  isModalOpen: boolean;
}

export function useKeyboardShortcuts({
  onPlayPause,
  onSeekForward,
  onSeekBackward,
  onToggleMetric,
  isModalOpen
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if modal is open (modal has its own handlers)
      if (isModalOpen) return;

      // Don't handle if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          onPlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onSeekBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onSeekForward();
          break;
        case '1':
          e.preventDefault();
          onToggleMetric('speed');
          break;
        case '2':
          e.preventDefault();
          onToggleMetric('hr');
          break;
        case '3':
          e.preventDefault();
          onToggleMetric('power');
          break;
        case '4':
          e.preventDefault();
          onToggleMetric('elevation');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlayPause, onSeekForward, onSeekBackward, onToggleMetric, isModalOpen]);
}
