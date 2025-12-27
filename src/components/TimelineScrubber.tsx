import { Play, Pause } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { Ride } from '../lib/types';

interface TimelineScrubberProps {
  ride: Ride | null;
  currentIndex: number;
  onSeek: (index: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
}

export default function TimelineScrubber({
  ride,
  currentIndex,
  onSeek,
  isPlaying,
  onPlayPause
}: TimelineScrubberProps) {
  if (!ride) {
    return null;
  }

  // Prepare chart data
  const chartData = ride.route.map((point, idx) => ({
    index: idx,
    elevation: point.ele,
    distance: point.distance, // Already in km from FIT parser
    time: new Date(point.time).getTime()
  }));

  const currentPoint = ride.route[currentIndex];

  const handleChartClick = (e: any) => {
    if (e && e.activeTooltipIndex !== undefined) {
      onSeek(e.activeTooltipIndex);
    }
  };

  // Format time for display
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Format elevation
  const formatElevation = (value: number) => {
    return `${value.toFixed(0)}m`;
  };

  return (
    <div
      className="border-t flex items-center gap-4 px-6 py-3"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-background)',
        height: '160px'
      }}
    >
      {/* Play/Pause button */}
      <button
        onClick={onPlayPause}
        className="flex-shrink-0 rounded-full p-2 transition-colors"
        style={{
          backgroundColor: 'var(--color-accent)',
          color: 'var(--color-background)'
        }}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>

      {/* Chart */}
      <div className="flex-1" style={{ height: '120px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            onClick={handleChartClick}
            style={{ cursor: 'pointer' }}
          >
            <defs>
              <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-elevation)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-elevation)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="distance"
              tick={{ fill: 'var(--color-foreground)', opacity: 0.5, fontSize: 11 }}
              tickFormatter={(value) => `${value.toFixed(0)}km`}
              stroke="var(--color-border)"
            />
            <YAxis
              dataKey="elevation"
              tick={{ fill: 'var(--color-foreground)', opacity: 0.5, fontSize: 11 }}
              tickFormatter={formatElevation}
              stroke="var(--color-border)"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'var(--color-foreground)',
                fontSize: '12px'
              }}
              labelFormatter={(value) => `${value.toFixed(1)} km`}
              formatter={(value: any, name: string) => {
                if (name === 'elevation') {
                  return [formatElevation(value), 'Elevation'];
                }
                return [value, name];
              }}
            />
            <Area
              type="monotone"
              dataKey="elevation"
              stroke="var(--color-elevation)"
              strokeWidth={1.5}
              fill="url(#elevationGradient)"
            />
            <ReferenceLine
              x={chartData[currentIndex]?.distance}
              stroke="var(--color-accent)"
              strokeWidth={2}
              strokeDasharray="0"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Current stats */}
      <div className="flex-shrink-0 text-right tabular-nums text-sm">
        <div style={{ color: 'var(--color-foreground)' }}>
          {formatTime(currentPoint.time)}
        </div>
        <div style={{ color: 'var(--color-foreground)', opacity: 0.6 }}>
          {currentPoint.distance.toFixed(1)} km
        </div>
        <div style={{ color: 'var(--color-foreground)', opacity: 0.6 }}>
          {currentPoint.ele.toFixed(0)} m
        </div>
      </div>
    </div>
  );
}
