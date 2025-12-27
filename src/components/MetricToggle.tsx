import { Gauge, Heart, Zap, Mountain } from 'lucide-react';
import type { MetricType } from '../lib/types';

interface MetricToggleProps {
  selected: MetricType;
  onChange: (metric: MetricType) => void;
  availableMetrics?: Set<MetricType>;
}

export default function MetricToggle({ selected, onChange, availableMetrics }: MetricToggleProps) {
  const metrics = [
    { type: 'speed' as MetricType, icon: Gauge, label: 'Speed', color: 'var(--color-speed)' },
    { type: 'elevation' as MetricType, icon: Mountain, label: 'Elevation', color: 'var(--color-elevation)' }
  ];

  return (
    <div className="flex gap-2">
      {metrics.map(({ type, icon: Icon, label, color }) => {
        const isSelected = selected === type;
        const isDisabled = availableMetrics && !availableMetrics.has(type);

        return (
          <button
            key={type}
            onClick={() => !isDisabled && onChange(type)}
            disabled={isDisabled}
            className="rounded-full px-4 py-2 text-sm font-medium transition-all flex items-center gap-2"
            style={
              isSelected
                ? {
                    backgroundColor: color,
                    color: 'var(--color-background)',
                    borderWidth: '1px',
                    borderColor: color
                  }
                : {
                    backgroundColor: 'transparent',
                    color: isDisabled ? 'rgba(255,255,255,0.3)' : 'var(--color-foreground)',
                    borderWidth: '1px',
                    borderColor: isDisabled ? 'rgba(255,255,255,0.1)' : 'var(--color-border)',
                    opacity: isDisabled ? 0.5 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'pointer'
                  }
            }
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
